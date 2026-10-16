/**
 * The run detail's console strip, following the log. Collapsible: the header
 * bar always stays visible, the log body folds away and the viewport flexes
 * into the space.
 */

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "./icons";
import { MONO, PulseDot } from "./ui";

/** Session-scoped memory for the console strip's collapsed state. */
const CONSOLE_COLLAPSED_KEY = "atomify_run_console_collapsed";

const RunConsole = ({
  live,
  lines: consoleLines,
}: {
  live: boolean;
  lines: string[];
}) => {
  const consoleRef = useRef<HTMLDivElement | null>(null);
  // Collapsible console strip: default collapsed so the viewport gets the
  // height; an explicit expand is remembered for the session.
  const [consoleCollapsed, setConsoleCollapsed] = useState(
    () => sessionStorage.getItem(CONSOLE_COLLAPSED_KEY) !== "0",
  );
  const toggleConsole = () =>
    setConsoleCollapsed((previous) => {
      const next = !previous;
      sessionStorage.setItem(CONSOLE_COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });

  useEffect(() => {
    const element = consoleRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [consoleLines.length, consoleCollapsed]);

  return (
    <div
      data-testid="run-console"
      style={{
        height: consoleCollapsed ? "auto" : 190,
        flexShrink: 0,
        borderTop: "1px solid var(--border)",
        background: "var(--console-bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        onClick={toggleConsole}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 18px",
          borderBottom: consoleCollapsed
            ? "none"
            : "1px solid var(--console-line)",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <button
          onClick={(event) => {
            event.stopPropagation();
            toggleConsole();
          }}
          data-testid="run-console-toggle"
          aria-label={consoleCollapsed ? "Expand console" : "Collapse console"}
          aria-expanded={!consoleCollapsed}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 18,
            height: 18,
            padding: 0,
            border: "none",
            borderRadius: 5,
            background: "transparent",
            color: "var(--media-text-3)",
            cursor: "pointer",
            transform: consoleCollapsed ? "rotate(180deg)" : "none",
            transition: "transform .15s",
          }}
        >
          <ChevronDownIcon size={13} />
        </button>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 11.5,
            color: "var(--media-text-3)",
          }}
        >
          console — log.lammps
        </span>
        <div style={{ flex: 1 }} />
        {live && (
          <>
            {!consoleCollapsed && (
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  color: "var(--media-text-4)",
                }}
              >
                following
              </span>
            )}
            <PulseDot size={6} />
          </>
        )}
      </div>
      {!consoleCollapsed && (
        <div
          ref={consoleRef}
          style={{
            flex: 1,
            overflow: "auto",
            padding: "10px 18px",
            fontFamily: MONO,
            fontSize: 12,
            lineHeight: 1.7,
            color: "var(--console-text)",
          }}
        >
          {consoleLines.length === 0 ? (
            <div style={{ color: "var(--media-text-4)" }}>
              {live ? "waiting for output…" : "no log recorded"}
            </div>
          ) : (
            consoleLines.map((line, index) => (
              <div key={index} style={{ whiteSpace: "pre" }}>
                {line}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default RunConsole;
