// CI guard: the vendored Python wheel pypi/lammps_js-<ver>-py3-none-any.whl
// (served to JupyterLite via piplite) must match the installed lammps.js npm
// package, whose dist/ `make jupyter` copies into public/jupyter/lammps. A
// mismatch means notebooks would talk to a different engine version than the
// one they import. Run after `npm ci`.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const npmVersion = JSON.parse(
  readFileSync(join(root, "node_modules/lammps.js/package.json"), "utf8"),
).version;

const wheels = readdirSync(join(root, "pypi"))
  .map((name) => name.match(/^lammps_js-(.+)-py3-none-any\.whl$/))
  .filter(Boolean);

if (wheels.length !== 1) {
  console.error(
    `error: expected exactly one pypi/lammps_js-<ver>-py3-none-any.whl, found ${wheels.length}` +
      (wheels.length ? `: ${wheels.map((m) => m[0]).join(", ")}` : ""),
  );
  process.exit(1);
}

const wheelVersion = wheels[0][1];
if (wheelVersion !== npmVersion) {
  console.error(
    `error: lammps.js version mismatch: node_modules/lammps.js is ${npmVersion} ` +
      `but the vendored wheel is pypi/${wheels[0][0]} (${wheelVersion}).\n` +
      `Update the wheel in pypi/ and the exact "lammps.js" pin in package.json together.`,
  );
  process.exit(1);
}

console.log(`lammps.js ${npmVersion} matches pypi/${wheels[0][0]}`);
