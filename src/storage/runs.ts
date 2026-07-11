/**
 * Run management (ADR-001 §2, §5, §7): allocation of run directories,
 * working-tree snapshots, run metadata, zombie reconciliation, and sweep
 * expansion. Pure layout convention over ProjectStorage — deliberately not
 * part of the storage interface so the swappable surface stays minimal.
 */

import type {
  FileStat,
  ProjectStorage,
  RunListEntry,
  RunMeta,
  RunStatus,
} from "./types";

export const RUNS_DIR = "runs";
export const RUN_META_PATH = ".atomify/run.json";

/** Files above this many bytes are recorded in snapshotGaps, not copied. */
export const SNAPSHOT_SIZE_CAP = 64 * 1024 * 1024;

/** Notebook-origin "running" runs younger than this are left alone. */
export const NOTEBOOK_RUN_GRACE_MS = 10 * 60 * 1000;

const RUN_ID_PATTERN = /^run-(\d+)$/;

/**
 * Allocate the next run-NNN directory. The directory record is written
 * immediately — that write is the claim (ADR-001 §2) — so a concurrent
 * creator that observes the tree afterwards allocates the next number.
 */
export async function allocateRunDir(
  storage: ProjectStorage,
  dirName: string,
): Promise<string> {
  const existing = await storage.list(dirName, RUNS_DIR).catch(() => []);
  let next = 1;
  for (const entry of existing) {
    const match = RUN_ID_PATTERN.exec(entry.path.slice(RUNS_DIR.length + 1));
    if (match) {
      next = Math.max(next, Number(match[1]) + 1);
    }
  }
  for (;;) {
    const runId = `run-${String(next).padStart(3, "0")}`;
    const runPath = `${RUNS_DIR}/${runId}`;
    if (!(await storage.stat(dirName, runPath))) {
      // Claim by writing the run.json parent chain (creates the dir records).
      await storage.write(
        dirName,
        `${runPath}/${RUN_META_PATH}`,
        JSON.stringify(placeholderMeta(runId), null, 2),
      );
      return runId;
    }
    next++;
  }
}

function placeholderMeta(runId: string): RunMeta {
  return {
    schemaVersion: 1,
    id: runId,
    inputScript: "",
    status: "running",
    startedAt: new Date().toISOString(),
    origin: "app",
  };
}

/**
 * Snapshot the working tree into the run directory (ADR-001 §2 contract):
 * excludes runs/, .atomify/, and *.ipynb; files above the size cap are
 * recorded as explicit provenance gaps instead of copied.
 */
export async function snapshotWorkingTree(
  storage: ProjectStorage,
  dirName: string,
  runId: string,
  options?: { sizeCap?: number },
): Promise<{ copied: string[]; gaps: RunMeta["snapshotGaps"] }> {
  const sizeCap = options?.sizeCap ?? SNAPSHOT_SIZE_CAP;
  const entries = await storage.list(dirName);
  const copied: string[] = [];
  const gaps: NonNullable<RunMeta["snapshotGaps"]> = [];

  for (const entry of entries) {
    if (!isSnapshotted(entry)) {
      continue;
    }
    if (entry.size > sizeCap) {
      const content = await storage.read(dirName, entry.path);
      gaps.push({
        path: entry.path,
        size: entry.size,
        sha256: await sha256Hex(content),
      });
      continue;
    }
    const content = await storage.read(dirName, entry.path);
    await storage.write(
      dirName,
      `${RUNS_DIR}/${runId}/${entry.path}`,
      content,
    );
    copied.push(entry.path);
  }
  return { copied, gaps };
}

function isSnapshotted(entry: FileStat): boolean {
  if (entry.type === "directory") {
    // Working-tree subdirectories are not snapshotted in v1 (the Files UI
    // doesn't create them); runs/ and .atomify/ are excluded by contract.
    return false;
  }
  if (entry.path.endsWith(".ipynb")) {
    return false;
  }
  return true;
}

export async function writeRunMeta(
  storage: ProjectStorage,
  dirName: string,
  meta: RunMeta,
): Promise<void> {
  await storage.write(
    dirName,
    `${RUNS_DIR}/${meta.id}/${RUN_META_PATH}`,
    JSON.stringify(meta, null, 2),
  );
}

export async function readRunMeta(
  storage: ProjectStorage,
  dirName: string,
  runId: string,
): Promise<RunMeta | null> {
  try {
    const raw = await storage.read(
      dirName,
      `${RUNS_DIR}/${runId}/${RUN_META_PATH}`,
    );
    const meta = JSON.parse(
      typeof raw === "string" ? raw : new TextDecoder().decode(raw),
    ) as RunMeta;
    return { ...meta, id: runId };
  } catch {
    return null;
  }
}

/**
 * List runs, newest first. Directories without run.json (scripted/external
 * runs, ADR-001 §5) are listed with meta null and the directory mtime.
 */
export async function listRuns(
  storage: ProjectStorage,
  dirName: string,
): Promise<RunListEntry[]> {
  const entries = await storage.list(dirName, RUNS_DIR).catch(() => []);
  const runs: RunListEntry[] = [];
  for (const entry of entries) {
    if (entry.type !== "directory") {
      continue;
    }
    const runId = entry.path.slice(RUNS_DIR.length + 1);
    const meta = await readRunMeta(storage, dirName, runId);
    runs.push({
      runId,
      meta,
      lastModified: meta?.finishedAt ?? meta?.startedAt ?? entry.lastModified,
    });
  }
  return runs.sort((a, b) => b.lastModified.localeCompare(a.lastModified));
}

/**
 * Zombie reconciliation (ADR-001 §5): a "running" run not owned by this
 * session becomes "interrupted" — immediately for app/sweep origins (one app
 * session owns the engine), and only after a grace window for notebook
 * origins (the kernel may genuinely still be executing it).
 */
export async function reconcileRuns(
  storage: ProjectStorage,
  dirName: string,
  ownedRunIds: ReadonlySet<string>,
  now: Date = new Date(),
): Promise<string[]> {
  const runs = await listRuns(storage, dirName);
  const interrupted: string[] = [];
  for (const run of runs) {
    if (!run.meta || run.meta.status !== "running") {
      continue;
    }
    if (ownedRunIds.has(run.runId)) {
      continue;
    }
    if (run.meta.origin === "notebook") {
      const metaStat = await storage.stat(
        dirName,
        `${RUNS_DIR}/${run.runId}/${RUN_META_PATH}`,
      );
      const age =
        now.getTime() - new Date(metaStat?.lastModified ?? 0).getTime();
      if (age < NOTEBOOK_RUN_GRACE_MS) {
        continue;
      }
    }
    const meta: RunMeta = {
      ...run.meta,
      status: "interrupted" as RunStatus,
      finishedAt: run.meta.finishedAt ?? now.toISOString(),
    };
    await writeRunMeta(storage, dirName, meta);
    interrupted.push(run.runId);
  }
  return interrupted;
}

/**
 * Sweep expansion (ADR-001 §7): the cartesian product of per-variable value
 * lists, in stable order (first variable varies slowest).
 */
export function expandSweep(
  variables: Record<string, number[]>,
): Record<string, number>[] {
  const names = Object.keys(variables);
  if (names.length === 0) {
    return [];
  }
  let combinations: Record<string, number>[] = [{}];
  for (const name of names) {
    const values = variables[name];
    if (values.length === 0) {
      return [];
    }
    combinations = combinations.flatMap((combo) =>
      values.map((value) => ({ ...combo, [name]: value })),
    );
  }
  return combinations;
}

/**
 * Parse sweep values: a comma list ("1, 1.5, 2") or a range with step
 * ("1:3:0.5" = start:end:step, end inclusive within float tolerance).
 */
export function parseSweepValues(input: string): number[] {
  const trimmed = input.trim();
  if (trimmed === "") {
    return [];
  }
  if (trimmed.includes(":")) {
    const parts = trimmed.split(":").map((part) => Number(part.trim()));
    if (parts.length !== 3 || parts.some((value) => !Number.isFinite(value))) {
      throw new Error(`Invalid range (expected start:end:step): ${input}`);
    }
    const [start, end, step] = parts;
    if (step === 0 || Math.sign(end - start) * Math.sign(step) < 0) {
      throw new Error(`Range never reaches its end: ${input}`);
    }
    const values: number[] = [];
    const count = Math.floor((end - start) / step + 1e-9);
    for (let i = 0; i <= count; i++) {
      // Multiply instead of accumulating so float error doesn't drift.
      values.push(Number((start + i * step).toPrecision(12)));
    }
    return values;
  }
  return trimmed.split(",").map((part) => {
    const value = Number(part.trim());
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid number in sweep values: "${part.trim()}"`);
    }
    return value;
  });
}

async function sha256Hex(content: string | Uint8Array): Promise<string> {
  const bytes =
    typeof content === "string" ? new TextEncoder().encode(content) : content;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    bytes.buffer instanceof ArrayBuffer && bytes.byteOffset === 0 &&
      bytes.byteLength === bytes.buffer.byteLength
      ? bytes.buffer
      : bytes.slice().buffer,
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
