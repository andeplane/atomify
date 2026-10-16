/**
 * The New Project modal's "Start from" pieces: the source cards, the
 * browsable example picker and the upload dropzone.
 */

import { useMemo, useRef } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { Example } from "../../hooks/useExamples";
import { MONO } from "../ui";

export const SourceCard = ({
  selected,
  onClick,
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  testId,
}: {
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  testId: string;
}) => (
  <div
    onClick={onClick}
    data-testid={testId}
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 10,
      alignItems: "flex-start",
      padding: 12,
      borderRadius: 12,
      cursor: "pointer",
      border: `1.5px solid ${selected ? "var(--accent)" : "var(--border)"}`,
      background: selected ? "var(--accent-soft)" : "var(--surface-2)",
    }}
  >
    <span
      style={{
        width: 32,
        height: 32,
        borderRadius: 9,
        background: iconBg,
        color: iconColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon}
    </span>
    <span>
      <span
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 700,
          color: "var(--text)",
        }}
      >
        {title}
      </span>
      <span
        style={{
          display: "block",
          fontSize: 11.5,
          color: "var(--text-2)",
          marginTop: 2,
          lineHeight: 1.4,
        }}
      >
        {subtitle}
      </span>
    </span>
  </div>
);

export const ExamplePicker = ({
  examples,
  exampleQuery,
  setExampleQuery,
  pickedExample,
  setPickedExample,
}: {
  examples: Example[];
  exampleQuery: string;
  setExampleQuery: (query: string) => void;
  pickedExample: string | undefined;
  setPickedExample: (id: string) => void;
}) => {
  // Browsable picker: the whole library, filtered like the Examples screen.
  const filteredExamples = useMemo(() => {
    const query = exampleQuery.trim().toLowerCase();
    if (!query) {
      return examples;
    }
    return examples.filter((example) => {
      const haystack = [
        example.title,
        example.description,
        ...(example.keywords ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [examples, exampleQuery]);

  return (
    <div style={{ marginBottom: 20 }}>
      <input
        className="shell-input"
        data-testid="np-example-search"
        value={exampleQuery}
        placeholder="Search examples — title, description or keyword"
        onChange={(event) => setExampleQuery(event.target.value)}
        style={{ marginBottom: 10 }}
      />
      <div
        data-testid="example-picker"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 10,
          maxHeight: "min(44vh, 420px)",
          overflowY: "auto",
          paddingRight: 4,
          alignContent: "start",
        }}
      >
        {filteredExamples.map((example) => {
          const selected = pickedExample === example.id;
          const category = example.keywords?.[0];
          return (
            <div
              key={example.id}
              onClick={() => setPickedExample(example.id)}
              data-testid={`np-example-card-${example.id}`}
              style={{
                padding: 7,
                borderRadius: 11,
                cursor: "pointer",
                border: `1.5px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                background: selected
                  ? "var(--accent-soft)"
                  : "var(--surface-2)",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "16 / 10",
                  borderRadius: 7,
                  overflow: "hidden",
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
                      top: 6,
                      left: 6,
                      padding: "2px 6px",
                      borderRadius: 5,
                      background: "rgba(8,10,14,0.7)",
                      backdropFilter: "blur(6px)",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {category}
                  </span>
                )}
              </div>
              <span
                style={{
                  display: "block",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "var(--text)",
                  marginTop: 7,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {example.title}
              </span>
            </div>
          );
        })}
        {filteredExamples.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: "22px 0",
              textAlign: "center",
              fontSize: 12.5,
              color: "var(--text-3)",
            }}
          >
            No examples match “{exampleQuery.trim()}”.
          </div>
        )}
      </div>
    </div>
  );
};

export const UploadPicker = ({
  uploads,
  setUploads,
}: {
  uploads: File[];
  setUploads: Dispatch<SetStateAction<File[]>>;
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          // Same eager capture as onChange below: dataTransfer is
          // neutered once the handler returns.
          const dropped = Array.from(event.dataTransfer.files);
          setUploads((previous) => [...previous, ...dropped]);
        }}
        data-testid="upload-dropzone"
        style={{
          border: "1.5px dashed var(--border-strong)",
          borderRadius: 12,
          padding: "22px 20px",
          textAlign: "center",
          background: "var(--surface-2)",
          marginBottom: 8,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "var(--text)",
          }}
        >
          {uploads.length === 0
            ? "Drop files here, or click to browse"
            : `${uploads.length} ${uploads.length === 1 ? "file" : "files"} selected`}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 5 }}>
          {uploads.length === 0
            ? "Input scripts, data files, notebooks"
            : uploads.map((file) => file.name).join(", ")}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={(event) => {
            if (event.target.files) {
              // Capture the FileList NOW: the functional updater runs
              // after this handler returns, by which time the
              // `value = ""` reset below has already emptied
              // event.target.files (real bug caught by the zip-import
              // e2e test).
              const picked = Array.from(event.target.files);
              setUploads((previous) => [...previous, ...picked]);
              event.target.value = "";
            }
          }}
        />
      </div>
      {uploads.length === 1 &&
      uploads[0].name.toLowerCase().endsWith(".zip") ? (
        <div
          data-testid="np-import-zip"
          style={{
            fontSize: 11.5,
            color: "var(--text-3)",
            lineHeight: 1.5,
            marginBottom: 18,
          }}
        >
          The zip is unpacked as a whole project. An exported project's{" "}
          <span style={{ fontFamily: MONO }}>.atomify/project.json</span>{" "}
          supplies name, color and input-script defaults — the name field above
          wins.
        </div>
      ) : (
        <div
          style={{
            fontSize: 11.5,
            color: "var(--text-3)",
            lineHeight: 1.5,
            marginBottom: 18,
          }}
        >
          If exactly one <span style={{ fontFamily: MONO }}>.in</span> script is
          included it becomes the input script automatically; otherwise you'll
          pick one on first run. A single{" "}
          <span style={{ fontFamily: MONO }}>.zip</span> is imported as a whole
          project.
        </div>
      )}
    </>
  );
};
