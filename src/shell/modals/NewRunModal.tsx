/**
 * New Run modal (ADR-003 §4.4–4.5): input-script chooser when the project
 * has no designated script, per-variable parameter rows (fixed value or
 * from/to/steps sweep), the multithreading toggle, a command preview, and
 * the run-count summary. Starting expands the cartesian product into a
 * sequential queue via startRuns.
 */

import { useEffect, useMemo, useState } from "react";
import { useEngineState, useStoreActions, useStoreState } from "../../hooks";
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
import { ScriptIcon } from "../icons";
import {
  GhostButton,
  ModalShell,
  MONO,
  PrimaryButton,
  ToggleSwitch,
} from "../ui";
import NewRunParameterRow from "./NewRunParameterRow";
import NewRunScriptChooser from "./NewRunScriptChooser";

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
  const lammps = useEngineState((objects) => objects.lammps);
  const readFile = useStoreActions((actions) => actions.projects.readFile);
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

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="New run"
      testId="new-run-modal"
    >
      <div style={{ padding: "18px 24px 24px" }}>
        {choosing ? (
          <NewRunScriptChooser
            scripts={scripts}
            inputScript={inputScript}
            setChoosing={setChoosing}
            onClose={onClose}
            onGoToFiles={onGoToFiles}
          />
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
              <span
                style={{
                  color: "var(--accent)",
                  flexShrink: 0,
                  display: "flex",
                }}
              >
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
              <span style={{ fontFamily: MONO, color: "var(--text-2)" }}>
                -var
              </span>{" "}
              flags — the script itself never changes. To add or remove one,{" "}
              <span
                onClick={onGoToFiles}
                style={{
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                edit the script
              </span>
              .
            </div>

            {loadingScript && (
              <div
                style={{
                  padding: "10px 0",
                  fontSize: 12.5,
                  color: "var(--text-3)",
                }}
              >
                Reading script…
              </div>
            )}
            {!loadingScript && variables.length === 0 && (
              <div
                style={{
                  padding: "10px 0",
                  fontSize: 12.5,
                  color: "var(--text-3)",
                }}
              >
                No overridable variables found — the run uses the script as-is.
              </div>
            )}
            {variables.map((variable) => {
              const draft = drafts[variable.name];
              if (!draft) {
                return null;
              }
              return (
                <NewRunParameterRow
                  key={variable.name}
                  variable={variable}
                  draft={draft}
                  updateDraft={updateDraft}
                />
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
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    Multithreading
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--text-3)",
                      marginTop: 2,
                    }}
                  >
                    Runs LAMMPS with KOKKOS acceleration (×{threads} threads)
                  </div>
                </div>
                <ToggleSwitch
                  on={kokkos}
                  onToggle={() => setKokkos((value) => !value)}
                  data-testid="kokkos-toggle"
                />
              </div>
              {/* Deviation from the design mock: no per-run thread picker.
                  The engine's Kokkos thread pool is fixed at engine load
                  (KOKKOS_THREADS = 4), so a picker here could not take
                  effect. */}
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
                color: "var(--media-text-code)",
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
