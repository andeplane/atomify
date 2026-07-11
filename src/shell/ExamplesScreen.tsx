/**
 * Example library (ADR-003 §2): every example can be quick-run or used as
 * the starting point of a new project.
 */

import { useShellUI } from "./ShellContext";
import type { Example } from "../hooks/useExamples";
import { PlayIcon } from "./icons";

const ExampleLibraryCard = ({ example }: { example: Example }) => {
  const ui = useShellUI();
  const category = example.keywords?.[0];
  return (
    <div
      className="shell-card-hover"
      data-testid={`library-example-${example.id}`}
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "16 / 9",
          background: "var(--viewport)",
          backgroundImage: `url("${example.imageUrl}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {category && (
          <span
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              padding: "3px 8px",
              borderRadius: 6,
              background: "rgba(8,10,14,0.7)",
              backdropFilter: "blur(6px)",
              color: "#fff",
              fontSize: 10.5,
              fontWeight: 600,
            }}
          >
            {category}
          </span>
        )}
      </div>
      <div style={{ padding: "13px 14px 14px" }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 4,
          }}
        >
          {example.title}
        </div>
        <div
          style={{
            fontSize: 12.5,
            lineHeight: 1.5,
            color: "var(--text-2)",
            marginBottom: 12,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {example.description}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => ui.useExampleAsProject(example)}
            className="shell-use-btn"
            data-testid={`library-use-${example.id}`}
            style={{
              flex: 1,
              padding: "7px 10px",
              borderRadius: 8,
              border: "none",
              background: "var(--accent-soft)",
              color: "var(--accent)",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Use as project
          </button>
          <button
            onClick={() => ui.quickRunExample(example)}
            disabled={!ui.engineReady}
            title={ui.engineReady ? undefined : "Engine loading…"}
            className="shell-quick-btn"
            data-testid={`library-quick-${example.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 11px",
              borderRadius: 8,
              border: "1px solid var(--border-strong)",
              background: "transparent",
              color: "var(--text-2)",
              fontWeight: 600,
              fontSize: 12,
              cursor: ui.engineReady ? "pointer" : "not-allowed",
              opacity: ui.engineReady ? 1 : 0.5,
              fontFamily: "inherit",
            }}
          >
            <PlayIcon size={11} />
            Quick run
          </button>
        </div>
      </div>
    </div>
  );
};

const ExamplesScreen = () => {
  const ui = useShellUI();
  return (
    <div style={{ flex: 1, overflowY: "auto" }} data-testid="examples-screen">
      <div
        style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 40px 64px" }}
      >
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            color: "var(--text)",
          }}
        >
          Example library
        </h1>
        <p
          style={{
            margin: "0 0 26px",
            fontSize: 14.5,
            color: "var(--text-2)",
            maxWidth: 560,
            lineHeight: 1.6,
          }}
        >
          Every example can be quick-run to watch instantly, or used as the
          starting point for a new project.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {ui.examples.examples.map((example) => (
            <ExampleLibraryCard key={example.id} example={example} />
          ))}
        </div>
        {ui.examples.loading && (
          <p style={{ color: "var(--text-3)" }}>Loading examples…</p>
        )}
      </div>
    </div>
  );
};

export default ExamplesScreen;
