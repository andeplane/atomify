/**
 * The New Run modal's input-script chooser (ADR-003 §4.4), shown when the
 * project has no designated input script or the user asks to change it.
 */

import { useStoreActions } from "../../hooks";
import type { FileStat } from "../../storage";
import { formatBytes } from "../format";
import { InfoIcon } from "../icons";
import { GhostButton, MONO, PrimaryButton } from "../ui";

const NewRunScriptChooser = ({
  scripts,
  inputScript,
  setChoosing,
  onClose,
  onGoToFiles,
}: {
  scripts: FileStat[];
  inputScript: string | undefined;
  setChoosing: (choosing: boolean) => void;
  onClose: () => void;
  onGoToFiles: () => void;
}) => {
  const setInputScript = useStoreActions(
    (actions) => actions.projects.setInputScript,
  );

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          padding: "11px 14px",
          borderRadius: "var(--radius)",
          background: "var(--accent-soft)",
          border: "1px solid var(--accent-line)",
          fontSize: 13,
          color: "var(--text)",
          lineHeight: 1.5,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            color: "var(--accent)",
            flexShrink: 0,
            marginTop: 2,
            display: "flex",
          }}
        >
          <InfoIcon />
        </span>
        {scripts.length === 0
          ? "This project has no LAMMPS scripts yet. Add or upload an input script from the Files tab first."
          : "This project has no input script yet. Choose which script LAMMPS should run — you can change it any time from Files."}
      </div>
      {scripts.map((script) => {
        const selected = script.path === inputScript;
        return (
          <div
            key={script.path}
            data-testid={`script-choice-${script.path}`}
            onClick={() => {
              void setInputScript(script.path);
              setChoosing(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 14px",
              borderRadius: 11,
              cursor: "pointer",
              marginBottom: 8,
              border: `1.5px solid ${selected ? "var(--accent)" : "var(--border)"}`,
              background: selected ? "var(--accent-soft)" : "var(--surface-2)",
            }}
          >
            <span
              style={{
                width: 15,
                height: 15,
                borderRadius: "50%",
                border: selected
                  ? "5px solid var(--accent)"
                  : "1.5px solid var(--border-strong)",
                flexShrink: 0,
                boxSizing: "border-box",
              }}
            />
            <span
              style={{
                flex: 1,
                fontFamily: MONO,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {script.path}
            </span>
            <span
              style={{
                fontSize: 12,
                color: "var(--text-3)",
                flexShrink: 0,
              }}
            >
              {formatBytes(script.size)}
            </span>
          </div>
        );
      })}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 12,
        }}
      >
        {scripts.length === 0 && (
          <PrimaryButton data-testid="go-to-files" onClick={onGoToFiles}>
            Go to Files
          </PrimaryButton>
        )}
        <GhostButton onClick={onClose}>Cancel</GhostButton>
      </div>
    </>
  );
};

export default NewRunScriptChooser;
