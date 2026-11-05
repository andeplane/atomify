/** Runtime inspection files are excluded from saved run outputs. */
export const GROUP_INFO_FILE = "_wrapper_groups.info";
export const GROUP_VARIABLE_FILE = "_wrapper_groups.lmp";
export const GROUP_READY = "__ATOMIFY_GROUPS_READY__";
export const GROUP_LABEL_PREFIX = "Group: ";

/** Instrument execution boundaries, including literal run commands in if. */
export function prepareGroupInspection(content: string): string {
  const prelude = `info groups out overwrite ${GROUP_INFO_FILE}\nprint "${GROUP_READY}"\ninclude ${GROUP_VARIABLE_FILE}\n`;
  return content.replace(
    /^[\t ]*(?:(?:run|minimize)\b|if\b[^\n]*["'](?:run|minimize)\b)[^\n]*/gm,
    (line) => prelude + line,
  );
}

/**
 * Detect the GROUP_READY marker in one line of engine output. The marker can
 * arrive glued to the end of the previous output when that output lacked a
 * trailing newline, so match it as a suffix and hand back any text before it.
 */
export function splitGroupReady(text: string): {
  ready: boolean;
  before: string;
} {
  const trimmed = text.trimEnd();
  if (!trimmed.endsWith(GROUP_READY)) return { ready: false, before: text };
  return {
    ready: true,
    before: trimmed.slice(0, -GROUP_READY.length).trimEnd(),
  };
}

/** Parse the engine's actual group registry, including variable-expanded IDs. */
export function parseLammpsGroups(info: string): string[] {
  return (
    [
      ...info.matchAll(
        /^Group\[\s*\d+\]:\s+(\S+)\s+\((?:static|dynamic)\)\s*$/gm,
      ),
    ]
      .map((match) => match[1])
      // These names can be passed literally to is_defined() and gmask().
      .filter((name) => /^[\w.:+-]+$/.test(name))
  );
}
