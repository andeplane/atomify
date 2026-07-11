/**
 * New Project modal (ADR-003 §5, ADR-001 §6): name + folder preview,
 * Blank / From example / Upload sources, the example picker grid, and the
 * identity color picker.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useStoreActions } from "../../hooks";
import type { Example } from "../../hooks/useExamples";
import { slugify, classifyPath } from "../../storage";
import type { NewProjectFile } from "../../store/projects";
import { useShellUI } from "../ShellContext";
import { FileIcon, GridIcon, UploadIcon } from "../icons";
import { GhostButton, ModalShell, MONO, PrimaryButton } from "../ui";

export const PROJECT_COLORS = [
  "#3F6EFF",
  "#7C3AED",
  "#10B981",
  "#06B6D4",
  "#F43F5E",
  "#FFB020",
];

type Source = "blank" | "example" | "upload";

/** Files an example contributes to a project (curated notebook included). */
export function exampleProjectFiles(example: Example): NewProjectFile[] {
  const files: NewProjectFile[] = example.files.map((file) => ({
    fileName: file.fileName,
    content: file.content,
    url: file.url,
  }));
  if (example.analysisScript) {
    const name = example.analysisScript.slice(
      example.analysisScript.lastIndexOf("/") + 1,
    );
    files.push({ fileName: name, url: example.analysisScript });
  }
  return files;
}

interface NewProjectModalProps {
  open: boolean;
  initialExampleId?: string;
  onClose: () => void;
}

const SourceCard = ({
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
        style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text)" }}
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

const NewProjectModal = ({
  open,
  initialExampleId,
  onClose,
}: NewProjectModalProps) => {
  const createProject = useStoreActions(
    (actions) => actions.projects.createProject,
  );
  const writeFile = useStoreActions((actions) => actions.projects.writeFile);
  const ui = useShellUI();
  const examples = ui.examples.examples;

  const [name, setName] = useState("");
  const [source, setSource] = useState<Source>("blank");
  const [pickedExample, setPickedExample] = useState<string | undefined>(
    undefined,
  );
  const [color, setColor] = useState<string | undefined>(undefined);
  const [uploads, setUploads] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setSource(initialExampleId ? "example" : "blank");
      setPickedExample(initialExampleId);
      setColor(undefined);
      setUploads([]);
      setCreating(false);
    }
  }, [open, initialExampleId]);

  const chosenExample = useMemo(
    () => examples.find((example) => example.id === pickedExample),
    [examples, pickedExample],
  );

  const folder = slugify(name.trim() || "untitled-project");

  const create = async () => {
    if (creating) {
      return;
    }
    setCreating(true);
    try {
      let files: NewProjectFile[] = [];
      let inputScript: string | undefined;
      let sourceMeta: { type: "blank" | "upload" | "example"; exampleId?: string } = {
        type: "blank",
      };
      let binaries: File[] = [];

      if (source === "example") {
        const example = chosenExample ?? examples[0];
        if (!example) {
          ui.notify.error({ message: "Pick an example first." });
          setCreating(false);
          return;
        }
        files = exampleProjectFiles(example);
        inputScript = example.inputScript;
        sourceMeta = { type: "example", exampleId: example.id };
      } else if (source === "upload") {
        const textFiles = uploads.filter(
          (file) => classifyPath(file.name).format !== "base64",
        );
        binaries = uploads.filter(
          (file) => classifyPath(file.name).format === "base64",
        );
        files = await Promise.all(
          textFiles.map(async (file) => ({
            fileName: file.name,
            content: await file.text(),
          })),
        );
        sourceMeta = { type: "upload" };
      }

      const displayName =
        name.trim() ||
        (source === "example" && chosenExample
          ? chosenExample.title
          : "Untitled project");

      // Design palette assignment when the user doesn't pick: stable per name.
      const nameHash = Array.from(displayName).reduce(
        (sum, char) => sum + char.charCodeAt(0),
        0,
      );
      await createProject({
        displayName,
        color: color ?? PROJECT_COLORS[nameHash % PROJECT_COLORS.length],
        source: sourceMeta,
        files,
        inputScript,
      });
      // Binary uploads can't ride through createProject (string contents
      // only); write them into the now-active project directly.
      for (const file of binaries) {
        await writeFile({
          path: file.name,
          content: new Uint8Array(await file.arrayBuffer()),
        });
      }
      onClose();
    } catch (error) {
      ui.notify.error({
        message: "Could not create the project",
        description: error instanceof Error ? error.message : String(error),
      });
      setCreating(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="New project"
      maxWidth={620}
      testId="new-project-modal"
    >
      <div style={{ padding: "18px 24px 24px" }}>
        <label
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: 8,
          }}
        >
          Project name
        </label>
        <input
          className="shell-input"
          data-testid="project-name-input"
          value={name}
          autoFocus
          placeholder="e.g. Silica fracture study"
          onChange={(event) => setName(event.target.value)}
          style={{ marginBottom: 7 }}
        />
        <div
          style={{
            fontSize: 11.5,
            color: "var(--text-3)",
            marginBottom: 18,
            lineHeight: 1.5,
          }}
        >
          Folder{" "}
          <span style={{ fontFamily: MONO, color: "var(--text-2)" }}>
            {folder}/
          </span>{" "}
          — this is what the notebook file browser shows. The name can change
          later; the folder can't.
        </div>

        <label
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: 8,
          }}
        >
          Start from
        </label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <SourceCard
            selected={source === "blank"}
            onClick={() => setSource("blank")}
            icon={<FileIcon />}
            iconBg="var(--chip)"
            iconColor="var(--text-2)"
            title="Blank"
            subtitle="Start from an empty working tree"
            testId="source-blank"
          />
          <SourceCard
            selected={source === "example"}
            onClick={() => setSource("example")}
            icon={<GridIcon size={15} />}
            iconBg="var(--accent-soft)"
            iconColor="var(--accent)"
            title="From example"
            subtitle="Copy an example's files in"
            testId="source-example"
          />
          <SourceCard
            selected={source === "upload"}
            onClick={() => setSource("upload")}
            icon={<UploadIcon />}
            iconBg="var(--good-soft)"
            iconColor="var(--good)"
            title="Upload"
            subtitle="Bring scripts & data files"
            testId="source-upload"
          />
        </div>

        {source === "blank" && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              fontSize: 12,
              color: "var(--text-2)",
              lineHeight: 1.55,
              marginBottom: 18,
            }}
          >
            Starts empty. Add files from the Files tab — once scripts exist,
            the Run button asks which one is the input script.
          </div>
        )}

        {source === "example" && (
          <div
            data-testid="example-picker"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
              marginBottom: 20,
              maxHeight: 280,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {examples.map((example) => {
              const selected = pickedExample === example.id;
              return (
                <div
                  key={example.id}
                  onClick={() => setPickedExample(example.id)}
                  data-testid={`pick-example-${example.id}`}
                  style={{
                    padding: 7,
                    borderRadius: 11,
                    cursor: "pointer",
                    border: `1.5px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                    background: selected ? "var(--accent-soft)" : "var(--surface-2)",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "16 / 10",
                      borderRadius: 7,
                      background: "var(--viewport)",
                      backgroundImage: `url("${example.imageUrl}")`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
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
          </div>
        )}

        {source === "upload" && (
          <>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                setUploads((previous) => [
                  ...previous,
                  ...Array.from(event.dataTransfer.files),
                ]);
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
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>
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
                    setUploads((previous) => [
                      ...previous,
                      ...Array.from(event.target.files ?? []),
                    ]);
                    event.target.value = "";
                  }
                }}
              />
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: "var(--text-3)",
                lineHeight: 1.5,
                marginBottom: 18,
              }}
            >
              If exactly one <span style={{ fontFamily: MONO }}>.in</span>{" "}
              script is included it becomes the input script automatically;
              otherwise you'll pick one on first run.
            </div>
          </>
        )}

        <label
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: 8,
          }}
        >
          Color
        </label>
        <div
          style={{
            display: "flex",
            gap: 9,
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          {PROJECT_COLORS.map((paletteColor) => (
            <button
              key={paletteColor}
              onClick={() => setColor(paletteColor)}
              data-testid={`color-${paletteColor}`}
              aria-label={`Color ${paletteColor}`}
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: paletteColor,
                cursor: "pointer",
                border: "none",
                flexShrink: 0,
                boxShadow:
                  (color ?? PROJECT_COLORS[0]) === paletteColor
                    ? `0 0 0 2px var(--surface), 0 0 0 4px ${paletteColor}`
                    : "none",
              }}
            />
          ))}
          <span style={{ fontSize: 11.5, color: "var(--text-3)", marginLeft: 4 }}>
            identity dot in the library
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              flex: 1,
              fontSize: 11.5,
              color: "var(--text-3)",
              lineHeight: 1.5,
            }}
          >
            Includes a starter{" "}
            <span style={{ fontFamily: MONO }}>analysis.ipynb</span> that shares
            the project's files.
          </span>
          <GhostButton onClick={onClose} style={{ flexShrink: 0 }}>
            Cancel
          </GhostButton>
          <PrimaryButton
            onClick={() => void create()}
            disabled={creating}
            data-testid="create-project"
            style={{ flexShrink: 0, padding: "9px 18px" }}
          >
            {creating ? "Creating…" : "Create project"}
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  );
};

export default NewProjectModal;
