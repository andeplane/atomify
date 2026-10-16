/**
 * New Project modal (ADR-003 §5, ADR-001 §6): name + folder preview,
 * Blank / From example / Upload sources, the example picker grid, and the
 * identity color picker.
 */

import { useEffect, useMemo, useState } from "react";
import { useStoreActions } from "../../hooks";
import type { Example } from "../../hooks/useExamples";
import { slugify, classifyPath } from "../../storage";
import type { NewProjectFile } from "../../store/projects";
import { useShellUI } from "../ShellContext";
import { FileIcon, GridIcon, UploadIcon } from "../icons";
import { GhostButton, ModalShell, MONO, PrimaryButton } from "../ui";
import { ExamplePicker, SourceCard, UploadPicker } from "./NewProjectSources";

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

const NewProjectModal = ({
  open,
  initialExampleId,
  onClose,
}: NewProjectModalProps) => {
  const createProject = useStoreActions(
    (actions) => actions.projects.createProject,
  );
  const importProject = useStoreActions(
    (actions) => actions.projects.importProject,
  );
  const writeFile = useStoreActions((actions) => actions.projects.writeFile);
  const ui = useShellUI();
  const examples = ui.examples.examples;

  const [name, setName] = useState("");
  const [source, setSource] = useState<Source>("blank");
  const [pickedExample, setPickedExample] = useState<string | undefined>(
    undefined,
  );
  const [exampleQuery, setExampleQuery] = useState("");
  const [color, setColor] = useState<string | undefined>(undefined);
  const [uploads, setUploads] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setSource(initialExampleId ? "example" : "blank");
      setPickedExample(initialExampleId);
      setExampleQuery("");
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
      // A single .zip upload is an import: unpack it as a whole project
      // (an exported project's .atomify/project.json supplies defaults;
      // the name field above wins).
      const zipUpload =
        source === "upload" &&
        uploads.length === 1 &&
        uploads[0].name.toLowerCase().endsWith(".zip")
          ? uploads[0]
          : null;
      if (zipUpload) {
        await importProject({
          zip: new Uint8Array(await zipUpload.arrayBuffer()),
          displayName: name.trim() || undefined,
          color,
        });
        onClose();
        return;
      }

      let files: NewProjectFile[] = [];
      let inputScript: string | undefined;
      let sourceMeta: {
        type: "blank" | "upload" | "example";
        exampleId?: string;
      } = {
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
      // "From example" expands into a browsable library picker.
      maxWidth={source === "example" ? 920 : 620}
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
            Starts empty. Add files from the Files tab — once scripts exist, the
            Run button asks which one is the input script.
          </div>
        )}

        {source === "example" && (
          <ExamplePicker
            examples={examples}
            exampleQuery={exampleQuery}
            setExampleQuery={setExampleQuery}
            pickedExample={pickedExample}
            setPickedExample={setPickedExample}
          />
        )}

        {source === "upload" && (
          <UploadPicker uploads={uploads} setUploads={setUploads} />
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
          <span
            style={{ fontSize: 11.5, color: "var(--text-3)", marginLeft: 4 }}
          >
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
