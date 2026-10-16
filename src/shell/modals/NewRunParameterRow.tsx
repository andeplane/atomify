/**
 * One parameter row of the New Run modal (ADR-003 §4.5): a script
 * variable's fixed value, or its from/to/steps sweep, and the Sweep toggle.
 */

import type { ScriptVariable } from "../../utils/scriptVariables";
import type { VarDrafts } from "../runPlan";
import { MONO } from "../ui";

const NewRunParameterRow = ({
  variable,
  draft,
  updateDraft,
}: {
  variable: ScriptVariable;
  draft: VarDrafts[string];
  updateDraft: (name: string, patch: Partial<VarDrafts[string]>) => void;
}) => {
  const sweeping = draft.mode === "sweep";
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
    <div
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
        <div
          style={{
            fontSize: 11,
            color: "var(--text-3)",
            marginTop: 2,
          }}
        >
          {variable.label ? `${variable.label} — ` : ""}line {variable.line}
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
              updateDraft(variable.name, {
                value: event.target.value,
              })
            }
            style={numberInputStyle(76)}
          />
        ) : (
          <>
            <input
              value={draft.from}
              data-testid={`var-from-${variable.name}`}
              onChange={(event) =>
                updateDraft(variable.name, {
                  from: event.target.value,
                })
              }
              style={numberInputStyle(62)}
            />
            <span style={{ color: "var(--text-3)", fontSize: 12 }}>to</span>
            <input
              value={draft.to}
              data-testid={`var-to-${variable.name}`}
              onChange={(event) =>
                updateDraft(variable.name, {
                  to: event.target.value,
                })
              }
              style={numberInputStyle(62)}
            />
            <span style={{ color: "var(--text-3)", fontSize: 12 }}>in</span>
            <input
              value={draft.steps}
              data-testid={`var-steps-${variable.name}`}
              onChange={(event) =>
                updateDraft(variable.name, {
                  steps: event.target.value,
                })
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
};

export default NewRunParameterRow;
