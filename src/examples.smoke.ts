// @vitest-environment node
/**
 * Example-library smoke test: runs every simulation in
 * public/examples/examples.json against the real atomify wasm build
 * (lammps.js/wasm-atomify), the way the app does — same LammpsAdapter, same
 * startup args, same script preprocessing (KOKKOS serial-style wrapping +
 * group inspection), same #/bond directives, same per-step snapshot calls —
 * and fails on any LAMMPS error or snapshot exception.
 *
 * Slow (minutes) and needs the real ~50 MB module, so it is not part of
 * `npm test`. Run it with `npm run test:examples` (vitest.examples.config.mts),
 * e.g. after bumping lammps.js. Knobs (env vars):
 *   EXAMPLES_MAX_SECONDS  wall-clock budget per example before it is stopped
 *                         like the Stop button does (default 120); errors
 *                         after that point go unnoticed
 *   EXAMPLES_MAX_RUN      cap literal `run N` lengths so every command in long
 *                         scripts is reached within the budget (default 1000;
 *                         0 disables). Keep it generous: scripts that ramp a
 *                         parameter over a run (fix adapt + ramp()) blow up
 *                         when the run is cut too short (micelle at 200).
 *   EXAMPLES_FILTER       only run examples whose id contains this string
 *   EXAMPLES_DEBUG        echo LAMMPS output live and keep all of it in errors
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import createModule from "lammps.js/wasm-atomify";
import type { LAMMPSWeb } from "lammps.js";

import { LammpsAdapter } from "./wasm/lammpsAdapter";
import type { AtomifyWasmModule } from "./wasm/types";
import {
  prepareScriptForSerialStyles,
  scriptOptsIntoKokkos,
} from "./utils/kokkos";
import {
  GROUP_INFO_FILE,
  GROUP_VARIABLE_FILE,
  parseLammpsGroups,
  prepareGroupInspection,
  splitGroupReady,
} from "./utils/lammpsGroups";
import { parseBond } from "./utils/parsers";

interface ExampleFile {
  fileName: string;
  url: string;
}
interface Example {
  id: string;
  title: string;
  inputScript: string;
  files: ExampleFile[];
}

const EXAMPLES_DIR = join(process.cwd(), "public", "examples");
const MAX_SECONDS = Number(process.env.EXAMPLES_MAX_SECONDS ?? 120);
const MAX_RUN = Number(process.env.EXAMPLES_MAX_RUN ?? 1000);
const FILTER = process.env.EXAMPLES_FILTER ?? "";
// Beyond the budget the Stop path needs a synced step to act on; a script
// stuck in one long command never reaches one, so give up on it eventually.
const HARD_TIMEOUT_MS = (MAX_SECONDS + 90) * 1000;

const examples: Example[] = (
  JSON.parse(readFileSync(join(EXAMPLES_DIR, "examples.json"), "utf8")) as {
    examples: Example[];
  }
).examples.filter((example) => example.id.includes(FILTER));

function capRunLengths(content: string): string {
  if (!MAX_RUN) return content;
  return content.replace(
    /^([ \t]*run[ \t]+)(\d+)\b/gm,
    (line, prefix: string, steps: string) =>
      Number(steps) > MAX_RUN ? `${prefix}${MAX_RUN}` : line,
  );
}

/** Same transforms as the store's syncFilesWasm. */
function prepareFile(
  content: string,
  isMainScript: boolean,
  kokkosOptIn: boolean,
): string {
  const styled = kokkosOptIn
    ? content
    : prepareScriptForSerialStyles(content, { isMainScript });
  return prepareGroupInspection(capRunLengths(styled));
}

interface Engine {
  module: AtomifyWasmModule;
  native: LAMMPSWeb;
  adapter: LammpsAdapter;
  output: string[];
  stepErrors: string[];
  hasRun: boolean;
}

async function loadEngine(): Promise<Engine> {
  const output: string[] = [];
  const stepErrors: string[] = [];
  let engine: Engine | undefined;
  const printLine = (...args: unknown[]) => {
    let text = args.join(" ");
    if (process.env.EXAMPLES_DEBUG) console.log("LMP>", text);
    const marker = splitGroupReady(text);
    if (marker.ready && engine) {
      const info = engine.module.FS.readFile(GROUP_INFO_FILE, {
        encoding: "utf8",
      });
      engine.module.FS.writeFile(
        GROUP_VARIABLE_FILE,
        engine.adapter.prepareGroupVariables(parseLammpsGroups(String(info))),
      );
      if (!marker.before) return;
      text = marker.before;
    }
    engine?.adapter.observeOutput(text);
    output.push(text);
  };
  const module = (await createModule({
    print: printLine,
    printErr: printLine,
  })) as unknown as AtomifyWasmModule;
  const native = new module.LAMMPSWeb();
  const adapter = new LammpsAdapter(module, native);
  adapter.start();
  engine = { module, native, adapter, output, stepErrors, hasRun: false };
  const live = engine;
  // Mirrors the worker's streamStep: everything it reads per synced step.
  adapter.setStepListener(() => {
    try {
      const particles = native.syncParticlesWrapped();
      native.syncBondsWrapped();
      native.syncSimulationBox();
      live.adapter.snapshotModifiers(null, particles.count);
      native.getCurrentStep();
      native.getRunMode();
      native.getRunStepsDone();
      native.getRunStepsTotal();
      native.getMemoryUsage();
      native.getThermo("spcpu");
      native.getThermo("cpuremain");
      native.getWalls();
    } catch (error) {
      if (live.stepErrors.length < 5) {
        live.stepErrors.push(
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  });
  return engine;
}

function mkdirp(module: AtomifyWasmModule, path: string) {
  let current = "";
  for (const part of path.split("/").filter(Boolean)) {
    current += `/${part}`;
    if (!module.FS.analyzePath(current).exists) module.FS.mkdir(current);
  }
}

interface ExampleResult {
  error: string;
  stopped: boolean;
  steps: number;
  seconds: number;
}

async function runExample(
  engine: Engine,
  example: Example,
): Promise<ExampleResult> {
  const { module, native, adapter } = engine;
  const dir = `/examples/${example.id}`;
  mkdirp(module, dir);
  module.FS.chdir(dir);
  native.clearBondDistances();
  native.setBuildNeighborlist(false);

  const files = example.files.map((file) => ({
    fileName: file.fileName,
    content: readFileSync(join(EXAMPLES_DIR, file.url), "utf8"),
  }));
  const inputContent =
    files.find((file) => file.fileName === example.inputScript)?.content ?? "";
  const kokkosOptIn = scriptOptsIntoKokkos(inputContent);
  for (const file of files) {
    if (!file.content) continue;
    module.FS.writeFile(
      `${dir}/${file.fileName}`,
      prepareFile(
        file.content,
        file.fileName === example.inputScript,
        kokkosOptIn,
      ),
    );
  }

  if (engine.hasRun) adapter.reset();
  engine.hasRun = true;
  for (const raw of inputContent.split("\n")) {
    const line = raw.trim();
    if (!line.startsWith("#/")) continue;
    const bond = parseBond(line.substring(2));
    if (bond) {
      native.setBondDistance(bond.atomType1, bond.atomType2, bond.distance);
      native.setBuildNeighborlist(true);
    }
  }

  engine.output.length = 0;
  engine.stepErrors.length = 0;
  const started = Date.now();
  let stopped = false;
  const budget = setTimeout(() => {
    stopped = true;
    adapter.cancel();
  }, MAX_SECONDS * 1000);
  let hardTimer: ReturnType<typeof setTimeout> | undefined;
  const hardTimeout = new Promise<"hung">((resolve) => {
    hardTimer = setTimeout(() => resolve("hung"), HARD_TIMEOUT_MS);
  });
  const outcome = await Promise.race([
    adapter
      .runFile(`${dir}/${example.inputScript}`)
      .then(() => "done" as const),
    hardTimeout,
  ]);
  clearTimeout(budget);
  clearTimeout(hardTimer);
  const seconds = (Date.now() - started) / 1000;
  if (outcome === "hung") {
    return {
      error: `did not finish within ${HARD_TIMEOUT_MS / 1000}s (no synced step to stop on)`,
      stopped,
      steps: 0,
      seconds,
    };
  }

  if (stopped) {
    // A stopped run resolves runFile after a grace period while the wasm may
    // still be unwinding (calls would return asyncify promises), so don't
    // touch this engine again: report it and let the caller load a fresh one.
    return { error: "", stopped, steps: -1, seconds };
  }
  let error = adapter.getErrorMessage();
  if (error.includes("Atomify::canceled")) error = "";
  if (!error) {
    // The worker's final post-run snapshot.
    try {
      const particles = native.syncParticlesWrapped();
      adapter.snapshotModifiers(null, particles.count);
    } catch (snapshotError) {
      error = `final snapshot: ${
        snapshotError instanceof Error
          ? snapshotError.message
          : String(snapshotError)
      }`;
    }
  }
  if (!error && engine.stepErrors.length) {
    error = `step snapshot: ${engine.stepErrors[0]}`;
  }
  if (!error) {
    const lammpsError = engine.output.find((line) => /^ERROR/.test(line));
    if (lammpsError) error = lammpsError;
  }
  if (error) {
    const tail = engine.output
      .slice(process.env.EXAMPLES_DEBUG ? 0 : -8)
      .join("\n");
    error = `${error}\n--- last output ---\n${tail}`;
  }
  return { error, stopped, steps: native.getCurrentStep(), seconds };
}

describe.sequential("example library", () => {
  let engine: Engine;
  const failures: string[] = [];

  beforeAll(async () => {
    engine = await loadEngine();
  }, 180_000);

  afterAll(() => {
    if (failures.length) {
      console.log(`\nFailing examples:\n${failures.join("\n")}`);
    }
  });

  it.each(examples.map((example) => [example.id, example] as const))(
    "%s",
    async (_id, example) => {
      let result: ExampleResult;
      try {
        result = await runExample(engine, example);
      } catch (error) {
        result = {
          error: error instanceof Error ? error.message : String(error),
          stopped: false,
          steps: 0,
          seconds: 0,
        };
      }
      console.log(
        `${example.id}: ${result.error ? "FAILED" : "ok"} ` +
          `(${result.seconds.toFixed(1)}s, step ${result.steps}` +
          `${result.stopped ? ", stopped at budget" : ""})`,
      );
      if (result.error) failures.push(example.id);
      if (result.error || result.stopped) {
        // A crashed, hung or stopped module poisons later runs; start fresh.
        engine = await loadEngine();
      }
      expect(result.error).toBe("");
    },
    HARD_TIMEOUT_MS + 120_000,
  );
});
