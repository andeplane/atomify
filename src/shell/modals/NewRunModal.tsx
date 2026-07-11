/**
 * New Run modal (ADR-003 §4.4–4.5): input-script chooser when the project
 * has no designated script, per-variable parameter rows (fixed value or
 * from/to/steps sweep), the multithreading toggle, a command preview, and
 * the run-count summary. Starting expands the cartesian product into a
 * sequential queue via startRuns.
 */

import { useEffect, useMemo, useState } from "react";
import { useStoreActions, useStoreState } from "../../hooks";
import { isScriptFile } from "../../store/projects";
import {
  parseScriptVariables,
  type ScriptVariable,
} from "../../utils/scriptVariables";
import { scriptOptsIntoKokkos } from "../../utils/kokkos";
import {
  buildCommandPreview,
  buildRunPlan,
  defaultDraft,
  defaultThreadCount,
  type VarDrafts,
} from "../runPlan";
import { InfoIcon, ScriptIcon } from "../icons";
import {
  GhostButton,
  ModalShell,
  MONO,
  PrimaryButton,
  ToggleSwitch,
} from "../ui";
import { formatBytes } from "../format";

interface NewRunModalProps {
  open: boolean;
  /** Start on the input-script chooser (no designated script yet). */
  choosingInput: boolean;
  onClose: () => void;
  onGoToFiles: () => void;
}

const NewRunModal = ({
  open,
  choosingInput: initialChoosing,
  onClose,
  onGoToFiles,
}: NewRunModalProps) => {
  const active = useStoreState((state) => state.projects.active);
  const lammps = useStoreState((state) => state.simulation.lammps);
  const readFile = useStoreActions((actions) => actions.projects.readFile);
  const setInputScript = useStoreActions(
    (actions) => actions.projects.setInputScript,
  );
  const startRuns = useStoreActions((actions) => actions.projects.startRuns);

  const [choosing, setChoosing] = useState(initialChoosing);
  const [variables, setVariables] = useState<ScriptVariable[]>([]);
  const [drafts, setDrafts] = useState<VarDrafts>({});
  const [kokkos, setKokkos] = useState(false);
  const [loadingScript, setLoadingScript] = useState(false);

  const inputScript = active?.meta.inputScript;
  const scripts = useMemo(
    () =>
      (active?.files ?? []).filter(
        (file) => file.type !== "directory" && isScriptFile(file.path),
      ),
    [active?.files],
  );

  useEffect(() => {
    if (open) {
      setChoosing(initialChoosing || !inputScript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialChoosing]);

  // Parse the input script's variables whenever it changes.
  useEffect(() => {
    if (!open || !inputScript) {
      return;
    }
    let mounted = true;
    setLoadingScript(true);
    readFile(inputScript)
      .then((content) => {
        if (!mounted) {
          return;
        }
        const parsed = parseScriptVariables(content);
        setVariables(parsed);
        const nextDrafts: VarDrafts = {};
        for (const variable of parsed) {
          nextDrafts[variable.name] = defaultDraft(variable);
        }
        setDrafts(nextDrafts);
        // KOKKOS is opt-in via a `suffix kk` line (src/utils/kokkos.ts):
        // default the toggle to the script's own choice.
        setKokkos(scriptOptsIntoKokkos(content));
      })
      .catch(() => {
        if (mounted) {
          setVariables([]);
          setDrafts({});
        }
      })
      .finally(() => {
        if (mounted) {
          setLoadingScript(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [open, inputScript, readFile]);

  const nextRunNumber = useMemo(() => {
    let next = 1;
    for (const run of active?.runs ?? []) {
      const match = /^run-(\d+)$/.exec(run.runId);
      if (match) {
        next = Math.max(next, Number(match[1]) + 1);
      }
    }
    return next;
  }, [active?.runs]);

  const threads = defaultThreadCount();
  const plan = useMemo(
    () => buildRunPlan(variables, drafts, nextRunNumber),
    [variables, drafts, nextRunNumber],
  );
  const command = useMemo(
    () =>
      buildCommandPreview(inputScript, variables, drafts, {
        enabled: kokkos,
        threads,
      }),
    [inputScript, variables, drafts, kokkos, threads],
  );

  if (!active) {
    return null;
  }

  const updateDraft = (name: string, patch: Partial<VarDrafts[string]>) =>
    setDrafts((previous) => ({
      ...previous,
      [name]: { ...previous[name], ...patch },
    }));

  const start = () => {
    if (!inputScript) {
      setChoosing(true);
      return;
    }
    void startRuns(
      plan.runs.map((vars) => ({
        inputScript,
        vars,
        useKokkos: kokkos,
        threads,
      })),
    );
    onClose();
  };

  const numberInputStyle = (width: number) => ({
    width,
    padding: "7px 9px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--surface-2)",
    color: "var(--text)",
    fontSize: 12.5,
    fontFamily: MONO,
    outline: "none",
    textAlign: "center" as const,
  });

  return (
    <ModalShell open={open} onClose={onClose} title="New run" testId="new-run-modal">
      <div style={{ padding: "18px 24px 24px" }}>
        {choosing ? (
          <>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                padding: "11px 14px",
                borderRadius: 10,
                background: "var(--accent-soft)",
                border: "1px solid var(--accent-line)",
                fontSize: 13,
                color: "var(--text)",
                lineHeight: 1.5,
                marginBottom: 16,
              }}
            >
              <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2, display: "flex" }}>
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
                  <span style={{ fontSize: 12, color: "var(--text-3)", flexShrink: 0 }}>
                    {formatBytes(script.size)}
                  </span>
                </div>
              );
            })}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
              {scripts.length === 0 && (
                <PrimaryButton data-testid="go-to-files" onClick={onGoToFiles}>
                  Go to Files
                </PrimaryButton>
              )}
              <GhostButton onClick={onClose}>Cancel</GhostButton>
            </div>
          </>
        ) : (
          <>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text)",
                marginBottom: 8,
              }}
            >
              Input script
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 14px",
                borderRadius: 11,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                marginBottom: 20,
              }}
            >
              <span style={{ color: "var(--accent)", flexShrink: 0, display: "flex" }}>
                <ScriptIcon size={16} />
              </span>
              <span
                data-testid="run-input-script"
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
                {inputScript}
              </span>
              <button
                onClick={() => setChoosing(true)}
                data-testid="change-input-script"
                className="shell-hoverable shell-hoverable-text"
                style={{
                  padding: "5px 11px",
                  borderRadius: 8,
                  border: "1px solid var(--border-strong)",
                  background: "transparent",
                  color: "var(--text-2)",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  flexShrink: 0,
                }}
              >
                Change
              </button>
            </div>

            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text)",
                marginBottom: 4,
              }}
            >
              Parameters
            </label>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-3)",
                lineHeight: 1.5,
                marginBottom: 6,
              }}
            >
              Every{" "}
              <span style={{ fontFamily: MONO, color: "var(--text-2)" }}>
                variable
              </span>{" "}
              set to a plain number in the input script appears here (derived
              expressions recompute automatically). Overrides are passed as{" "}
              <span style={{ fontFamily: MONO, color: "var(--text-2)" }}>-var</span>{" "}
              flags — the script itself never changes.
            </div>

            {loadingScript && (
              <div style={{ padding: "10px 0", fontSize: 12.5, color: "var(--text-3)" }}>
                Reading script…
              </div>
            )}
            {!loadingScript && variables.length === 0 && (
              <div style={{ padding: "10px 0", fontSize: 12.5, color: "var(--text-3)" }}>
                No overridable variables found — the run uses the script as-is.
              </div>
            )}
            {variables.map((variable) => {
              const draft = drafts[variable.name];
              if (!draft) {
                return null;
              }
              const sweeping = draft.mode === "sweep";
              return (
                <div
                  key={variable.name}
                  data-testid={`var-row-${variable.name}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div style={{ width: 104, flexShrink: 0 }}>
                    <div
                      style={{
                        fontFamily: MONO,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text)",
                      }}
                    >
                      {variable.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                      {variable.label ? `${variable.label} — ` : ""}line{" "}
                      {variable.line}
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    {!sweeping ? (
                      <input
                        value={draft.value}
                        data-testid={`var-value-${variable.name}`}
                        onChange={(event) =>
                          updateDraft(variable.name, { value: event.target.value })
                        }
                        style={numberInputStyle(76)}
                      />
                    ) : (
                      <>
                        <input
                          value={draft.from}
                          data-testid={`var-from-${variable.name}`}
                          onChange={(event) =>
                            updateDraft(variable.name, { from: event.target.value })
                          }
                          style={numberInputStyle(62)}
                        />
                        <span style={{ color: "var(--text-3)", fontSize: 12 }}>to</span>
                        <input
                          value={draft.to}
                          data-testid={`var-to-${variable.name}`}
                          onChange={(event) =>
                            updateDraft(variable.name, { to: event.target.value })
                          }
                          style={numberInputStyle(62)}
                        />
                        <span style={{ color: "var(--text-3)", fontSize: 12 }}>in</span>
                        <input
                          value={draft.steps}
                          data-testid={`var-steps-${variable.name}`}
                          onChange={(event) =>
                            updateDraft(variable.name, { steps: event.target.value })
                          }
                          style={numberInputStyle(46)}
                        />
                        <span style={{ color: "var(--text-3)", fontSize: 12 }}>runs</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      updateDraft(variable.name, {
                        mode: sweeping ? "fixed" : "sweep",
                      })
                    }
                    data-testid={`sweep-toggle-${variable.name}`}
                    className="shell-danger-hover"
                    style={{
                      padding: "5px 12px",
                      borderRadius: 999,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: 11.5,
                      fontWeight: 700,
                      flexShrink: 0,
                      background: sweeping ? "var(--accent)" : "var(--chip)",
                      color: sweeping ? "#fff" : "var(--text-2)",
                    }}
                  >
                    Sweep
                  </button>
                </div>
              );
            })}

            <div
              style={{
                marginTop: 14,
                padding: "12px 14px",
                borderRadius: 11,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                    Multithreading
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>
                    Runs LAMMPS with KOKKOS acceleration
                  </div>
                </div>
                <ToggleSwitch
                  on={kokkos}
                  onToggle={() => setKokkos((value) => !value)}
                  data-testid="kokkos-toggle"
                />
              </div>
              {/* Deviation from the design mock: no per-run thread picker.
                  The wasm build's thread pool is fixed when the engine loads,
                  so a picker here could not take effect. */}
            </div>

            <div
              data-testid="run-command-preview"
              style={{
                marginTop: 14,
                padding: "10px 12px",
                borderRadius: 9,
                background: "var(--viewport)",
                fontFamily: MONO,
                fontSize: 11.5,
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.75)",
                wordBreak: "break-all",
              }}
            >
              {command}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 18,
              }}
            >
              <span
                data-testid="run-summary"
                style={{
                  flex: 1,
                  fontSize: 12.5,
                  color: "var(--text-2)",
                  lineHeight: 1.5,
                }}
              >
                {plan.summary}
              </span>
              <GhostButton onClick={onClose} style={{ flexShrink: 0 }}>
                Cancel
              </GhostButton>
              <PrimaryButton
                onClick={start}
                disabled={!lammps || !inputScript}
                title={!lammps ? "Engine loading…" : undefined}
                data-testid="start-runs"
                style={{ flexShrink: 0, padding: "9px 18px" }}
              >
                {plan.cta}
              </PrimaryButton>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
};

export default NewRunModal;
