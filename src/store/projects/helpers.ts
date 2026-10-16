/**
 * Small helpers shared by the projects model's slices.
 */

import type { ProjectMeta, ProjectStorage } from "../../storage";
import type { StoreInjections } from "./types";

const SCRIPT_FILE = /(^|\/)in\.[^/]*$|\.in$/;

export function isScriptFile(fileName: string): boolean {
  return SCRIPT_FILE.test(fileName);
}

const COPY_DIR_NAME = /-copy(-\d+)?$/;

/**
 * A duplicate made before #400, which copied the original's example source
 * and so reports the original's exampleId to metrics on every run (#403).
 * Recognized by duplicateProject's naming ("<name> (copy)" ->
 * "<slug>-copy[-N]"); a genuine example's dirName is slug(displayName) and
 * often differs from its exampleId, so that comparison cannot be used.
 */
export function isStaleExampleCopy(meta: ProjectMeta): boolean {
  return (
    meta.source?.type === "example" &&
    (meta.displayName.endsWith("(copy)") || COPY_DIR_NAME.test(meta.dirName))
  );
}

export function storageFor(
  injections: StoreInjections,
  quick: boolean,
): ProjectStorage {
  return quick ? injections.scratchStorage : injections.libraryStorage;
}

/** Recursively copy a directory subtree between storages (same layout). */
export async function copyTree(
  from: ProjectStorage,
  fromDir: string,
  to: ProjectStorage,
  toDir: string,
  subdir?: string,
) {
  const entries = await from.list(fromDir, subdir);
  for (const entry of entries) {
    if (entry.type === "directory") {
      await copyTree(from, fromDir, to, toDir, entry.path);
    } else {
      await to.write(toDir, entry.path, await from.read(fromDir, entry.path));
    }
  }
}
