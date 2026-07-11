/**
 * Deep links (ADR-003 §3): ?project=&tab=&run=&file= map 1:1 onto the typed
 * Screen state so refresh restores position. Legacy params (script=, embed
 * codec URLs) are handled only by the embedded-mode path and are ignored
 * here. Unrelated params (e.g. examplesUrl) are preserved on updates.
 */

import type { ProjectTab, Screen } from "../store/projects";

const MANAGED_PARAMS = ["project", "tab", "run", "file", "screen"] as const;

export function parseDeepLink(search: string): Screen | null {
  const params = new URLSearchParams(search);
  const project = params.get("project");
  if (project) {
    const run = params.get("run") ?? undefined;
    const file = params.get("file") ?? undefined;
    const tabParam = params.get("tab");
    let tab: ProjectTab =
      tabParam === "runs" || tabParam === "notebook" || tabParam === "files"
        ? tabParam
        : "files";
    // Sub-screen params pin the tab they belong to.
    if (run) {
      tab = "runs";
    } else if (file) {
      tab = "files";
    }
    return {
      name: "project",
      dirName: project,
      tab,
      runId: run,
      filePath: run ? undefined : file,
    };
  }
  if (params.get("screen") === "examples") {
    return { name: "examples" };
  }
  return null;
}

/** New query string for a screen, preserving unmanaged params. */
export function screenToSearch(screen: Screen, currentSearch: string): string {
  const params = new URLSearchParams(currentSearch);
  for (const key of MANAGED_PARAMS) {
    params.delete(key);
  }
  if (screen.name === "examples") {
    params.set("screen", "examples");
  } else if (screen.name === "project") {
    params.set("project", screen.dirName);
    params.set("tab", screen.tab);
    if (screen.tab === "runs" && screen.runId) {
      params.set("run", screen.runId);
    }
    if (screen.tab === "files" && screen.filePath) {
      params.set("file", screen.filePath);
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
