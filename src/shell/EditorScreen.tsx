/**
 * Editor sub-screen of the Files tab (ADR-003 §5): Monaco with the LAMMPS
 * language, write-through debounced autosave with a visible saving/saved/
 * error indicator, and Save & run. Run outputs (paths under runs/) open
 * read-only with a "snapshot of run #NNN" banner.
 */

import { useCallback, useEffect, useState } from "react";
import Editor, { loader } from "@monaco-editor/react";
import { useStoreActions, useStoreState } from "../hooks";
import { isScriptFile } from "../store/projects";
import { registerLammpsLanguage } from "../utils/lammpsLanguage";
import { useShellUI } from "./ShellContext";
import { runNumber } from "./format";
import { BackIcon, CheckIcon, PlayIcon } from "./icons";
import { Chip, MONO, PrimaryButton } from "./ui";

// Same Monaco + LAMMPS language setup as the legacy Edit container.
loader.init().then((monaco) => {
  registerLammpsLanguage(monaco);
});

const EditorScreen = ({ filePath }: { filePath: string }) => {
  const active = useStoreState((state) => state.projects.active);
  const theme = useStoreState((state) => state.settings.theme);
  const saveState = useStoreState(
    (state) => state.projects.saveStates[filePath],
  );
  const readFile = useStoreActions((actions) => actions.projects.readFile);
  const saveFileDebounced = useStoreActions(
    (actions) => actions.projects.saveFileDebounced,
  );
  const flushPendingSaves = useStoreActions(
    (actions) => actions.projects.flushPendingSaves,
  );
  const setScreen = useStoreActions((actions) => actions.projects.setScreen);
  const ui = useShellUI();

  const [content, setContent] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const readOnly = filePath.startsWith("runs/");
  const snapshotRun = readOnly ? filePath.split("/")[1] : undefined;
  const fileName = filePath.slice(filePath.lastIndexOf("/") + 1);
  const isScript = isScriptFile(fileName);

  useEffect(() => {
    let mounted = true;
    setContent(null);
    setLoadError(null);
    readFile(filePath)
      .then((text) => {
        if (mounted) {
          setContent(text);
        }
      })
      .catch((error: unknown) => {
        if (mounted) {
          setLoadError(error instanceof Error ? error.message : String(error));
        }
      });
    return () => {
      mounted = false;
    };
  }, [filePath, readFile]);

  const onChange = useCallback(
    (value: string | undefined) => {
      if (readOnly || value === undefined) {
        return;
      }
      setContent(value);
      saveFileDebounced({ path: filePath, content: value });
    },
    [filePath, readOnly, saveFileDebounced],
  );

  if (!active) {
    return null;
  }

  const backToFiles = () =>
    setScreen({ name: "project", dirName: active.meta.dirName, tab: "files" });

  const saveIndicator =
    saveState === "saving" ? (
      <span style={{ color: "var(--text-3)" }}>Saving…</span>
    ) : saveState === "error" ? (
      <button
        onClick={() => {
          if (content !== null) {
            saveFileDebounced({ path: filePath, content });
          }
        }}
        style={{
          background: "none",
          border: "none",
          color: "var(--bad)",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 12,
          padding: 0,
        }}
      >
        Couldn't save — retry
      </button>
    ) : (
      <span
        title="Autosaved — changes persist as you type"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--text-3)",
        }}
      >
        <span style={{ color: "var(--good)", display: "flex" }}>
          <CheckIcon size={13} strokeWidth={2.4} />
        </span>
        Saved
      </span>
    );

  return (
    <div
      data-testid="editor-screen"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 32px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-2)",
        }}
      >
        <button
          onClick={backToFiles}
          data-testid="editor-back"
          className="shell-hoverable shell-hoverable-text"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            borderRadius: 8,
            border: "none",
            background: "transparent",
            color: "var(--text-2)",
            fontWeight: 600,
            fontSize: 12.5,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <BackIcon />
          Files
        </button>
        <span
          data-testid="editor-filename"
          style={{
            fontFamily: MONO,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {filePath}
        </span>
        <Chip>{isScript ? "LAMMPS script" : "Text file"}</Chip>
        <div style={{ flex: 1 }} />
        {!readOnly && (
          <span
            data-testid="editor-save-state"
            style={{ fontSize: 12, display: "inline-flex" }}
          >
            {saveIndicator}
          </span>
        )}
        {!readOnly && isScript && (
          <PrimaryButton
            data-testid="editor-save-and-run"
            disabled={!ui.engineReady}
            title={ui.engineReady ? undefined : "Engine loading…"}
            style={{ padding: "7px 14px", borderRadius: 9, fontSize: 12.5 }}
            onClick={() => {
              void (async () => {
                await flushPendingSaves();
                await ui.runProject();
              })();
            }}
          >
            <PlayIcon size={12} />
            Save & run
          </PrimaryButton>
        )}
      </div>

      {readOnly && snapshotRun && (
        <div
          data-testid="editor-snapshot-banner"
          style={{
            padding: "8px 32px",
            background: "var(--accent-soft)",
            borderBottom: "1px solid var(--accent-line)",
            fontSize: 12.5,
            color: "var(--text)",
          }}
        >
          Read-only — snapshot of run #{runNumber(snapshotRun)}. Edit the
          working-tree copy instead.
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0 }}>
        {loadError ? (
          <div style={{ padding: 32, color: "var(--bad)", fontSize: 13 }}>
            Could not open {filePath}: {loadError}
          </div>
        ) : content === null ? (
          <div style={{ padding: 32, color: "var(--text-3)", fontSize: 13 }}>
            Loading…
          </div>
        ) : (
          <Editor
            height="100%"
            language={isScript ? "lammps" : undefined}
            theme={theme === "dark" ? "vs-dark" : "light"}
            value={content}
            options={{ selectOnLineNumbers: true, readOnly }}
            onChange={onChange}
          />
        )}
      </div>
    </div>
  );
};

export default EditorScreen;
