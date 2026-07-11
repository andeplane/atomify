/**
 * Files tab (ADR-003 §5): working-tree table with search, New file, Upload,
 * drop-anywhere, the runs/ folder row (navigates to Runs), the input-script
 * chip, and per-row run/set-input/edit/download/rename/delete actions.
 * `.atomify/` is hidden.
 */

import { useMemo, useRef, useState } from "react";
import type { CSSProperties, DragEvent } from "react";
import { useStoreActions, useStoreState } from "../hooks";
import { isScriptFile } from "../store/projects";
import type { FileStat } from "../storage";
import { classifyPath } from "../storage";
import { useShellUI } from "./ShellContext";
import { formatBytes, relativeTime } from "./format";
import {
  ChartIcon,
  DotsIcon,
  DownloadIcon,
  EditIcon,
  FileIcon,
  FolderIcon,
  NewFileIcon,
  PlayIcon,
  ScriptIcon,
  SearchIcon,
  TargetIcon,
  UploadIcon,
} from "./icons";
import {
  Chip,
  ConfirmModal,
  GhostButton,
  MenuDivider,
  MenuItem,
  Popover,
  PrimaryButton,
  PromptModal,
  RowIconButton,
} from "./ui";

type FileKind = "folder" | "script" | "notebook" | "doc";

function kindOf(entry: FileStat): FileKind {
  if (entry.type === "directory") {
    return "folder";
  }
  if (entry.type === "notebook" || entry.path.endsWith(".ipynb")) {
    return "notebook";
  }
  if (isScriptFile(entry.path)) {
    return "script";
  }
  return "doc";
}

const ICON_COLORS: Record<FileKind, string> = {
  folder: "var(--warn)",
  script: "var(--accent)",
  notebook: "#E8735A",
  doc: "var(--text-3)",
};

const iconWrapStyle = (kind: FileKind): CSSProperties => ({
  width: 30,
  height: 30,
  borderRadius: 8,
  background: "var(--chip)",
  color: ICON_COLORS[kind],
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

const FileTypeIcon = ({ kind }: { kind: FileKind }) => {
  switch (kind) {
    case "folder":
      return <FolderIcon />;
    case "script":
      return <ScriptIcon />;
    case "notebook":
      return <ChartIcon />;
    case "doc":
      return <FileIcon />;
  }
};

const GRID_COLUMNS = "1fr 110px 130px 150px";

const FilesTab = () => {
  const active = useStoreState((state) => state.projects.active);
  const runs = useStoreState((state) => state.projects.active?.runs ?? []);
  const writeFile = useStoreActions((actions) => actions.projects.writeFile);
  const removeFile = useStoreActions((actions) => actions.projects.removeFile);
  const renameFile = useStoreActions((actions) => actions.projects.renameFile);
  const setInputScript = useStoreActions(
    (actions) => actions.projects.setInputScript,
  );
  const readFileRaw = useStoreActions(
    (actions) => actions.projects.readFileRaw,
  );
  const setScreen = useStoreActions((actions) => actions.projects.setScreen);
  const ui = useShellUI();

  const [search, setSearch] = useState("");
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const entries = useMemo(() => {
    const visible = (active?.files ?? []).filter(
      (entry) => !entry.path.startsWith(".atomify"),
    );
    const filtered = search
      ? visible.filter((entry) =>
          entry.path.toLowerCase().includes(search.toLowerCase()),
        )
      : visible;
    return [...filtered].sort((a, b) => {
      const aDir = a.type === "directory" ? 0 : 1;
      const bDir = b.type === "directory" ? 0 : 1;
      return aDir - bDir || a.path.localeCompare(b.path);
    });
  }, [active?.files, search]);

  if (!active) {
    return null;
  }
  const meta = active.meta;

  const openEntry = (entry: FileStat) => {
    const kind = kindOf(entry);
    if (entry.path === "runs") {
      setScreen({ name: "project", dirName: meta.dirName, tab: "runs" });
      return;
    }
    if (kind === "notebook") {
      if (!active.quick) {
        setScreen({ name: "project", dirName: meta.dirName, tab: "notebook" });
      }
      return;
    }
    if (kind === "folder") {
      return;
    }
    if (entry.format === "base64") {
      void download(entry.path);
      return;
    }
    setScreen({
      name: "project",
      dirName: meta.dirName,
      tab: "files",
      filePath: entry.path,
    });
  };

  const download = async (path: string) => {
    const content = await readFileRaw({ path });
    if (content === null) {
      ui.notify.error({ message: `Could not read ${path}.` });
      return;
    }
    const bytes =
      typeof content === "string"
        ? new TextEncoder().encode(content)
        : new Uint8Array(content);
    const blob = new Blob([bytes.buffer as ArrayBuffer], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = path.slice(path.lastIndexOf("/") + 1);
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const uploadFiles = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      try {
        const format = classifyPath(file.name).format;
        const content =
          format === "base64"
            ? new Uint8Array(await file.arrayBuffer())
            : await file.text();
        await writeFile({ path: file.name, content });
      } catch (error) {
        ui.notify.error({
          message: `Could not upload ${file.name}`,
          description: error instanceof Error ? error.message : String(error),
        });
      }
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length > 0) {
      void uploadFiles(event.dataTransfer.files);
    }
  };

  return (
    <div
      data-testid="files-tab"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px 32px 48px",
        outline: dragging ? "2px dashed var(--accent-line)" : "none",
        outlineOffset: -8,
      }}
    >
      <div style={{ maxWidth: 980 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 18,
          }}
        >
          <div style={{ position: "relative", flex: 1, maxWidth: 380 }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-3)",
                display: "flex",
              }}
            >
              <SearchIcon />
            </span>
            <input
              placeholder="Search files"
              value={search}
              data-testid="files-search"
              onChange={(event) => setSearch(event.target.value)}
              className="shell-input"
              style={{ padding: "9px 12px 9px 35px", fontSize: 13.5 }}
            />
          </div>
          <div style={{ flex: 1 }} />
          <GhostButton
            onClick={() => setNewFileOpen(true)}
            data-testid="new-file-button"
          >
            <NewFileIcon />
            New file
          </GhostButton>
          <PrimaryButton
            onClick={() => fileInputRef.current?.click()}
            data-testid="upload-button"
          >
            <UploadIcon />
            Upload
          </PrimaryButton>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            data-testid="upload-input"
            style={{ display: "none" }}
            onChange={(event) => {
              if (event.target.files) {
                void uploadFiles(event.target.files);
                event.target.value = "";
              }
            }}
          />
        </div>

        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 14,
            background: "var(--surface)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: GRID_COLUMNS,
              gap: 12,
              padding: "10px 18px",
              borderBottom: "1px solid var(--border)",
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-3)",
            }}
          >
            <span>Name</span>
            <span>Size</span>
            <span>Modified</span>
            <span />
          </div>

          {entries.map((entry) => {
            const kind = kindOf(entry);
            const isRunsFolder = entry.path === "runs";
            const isInput = entry.path === meta.inputScript;
            const isScript = kind === "script";
            const editable = kind !== "folder" && entry.format !== "base64";
            return (
              <div
                key={entry.path}
                onClick={() => openEntry(entry)}
                className="shell-row-hover"
                data-testid={`file-row-${entry.path}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: GRID_COLUMNS,
                  gap: 12,
                  alignItems: "center",
                  padding: "11px 18px",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    minWidth: 0,
                  }}
                >
                  <span style={iconWrapStyle(kind)}>
                    <FileTypeIcon kind={kind} />
                  </span>
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: "var(--text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      maxWidth: "65%",
                    }}
                  >
                    {entry.path}
                  </span>
                  {isInput && <Chip accent>Input script</Chip>}
                  {isRunsFolder && <Chip>one directory per run</Chip>}
                </span>
                <span
                  style={{
                    fontSize: 12.5,
                    color: "var(--text-2)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {isRunsFolder
                    ? `${runs.length} ${runs.length === 1 ? "run" : "runs"}`
                    : kind === "folder"
                      ? "—"
                      : formatBytes(entry.size)}
                </span>
                <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>
                  {relativeTime(entry.lastModified)}
                </span>
                <span
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 4,
                    position: "relative",
                  }}
                  onClick={(event) => event.stopPropagation()}
                >
                  {isScript && (
                    <RowIconButton
                      title="Run this file (doesn't change the input script)"
                      hover="shell-icon-hover-good"
                      disabled={!ui.engineReady}
                      data-testid={`run-file-${entry.path}`}
                      onClick={() => void ui.runFile(entry.path)}
                    >
                      <PlayIcon />
                    </RowIconButton>
                  )}
                  {isScript && !isInput && (
                    <RowIconButton
                      title="Set as input script"
                      hover="shell-icon-hover-accent"
                      data-testid={`set-input-${entry.path}`}
                      onClick={() => void setInputScript(entry.path)}
                    >
                      <TargetIcon />
                    </RowIconButton>
                  )}
                  {editable && (
                    <RowIconButton
                      title="Edit"
                      data-testid={`edit-file-${entry.path}`}
                      onClick={() =>
                        setScreen({
                          name: "project",
                          dirName: meta.dirName,
                          tab: "files",
                          filePath: entry.path,
                        })
                      }
                    >
                      <EditIcon />
                    </RowIconButton>
                  )}
                  {kind !== "folder" && (
                    <RowIconButton
                      title="Download"
                      data-testid={`download-file-${entry.path}`}
                      onClick={() => void download(entry.path)}
                    >
                      <DownloadIcon />
                    </RowIconButton>
                  )}
                  {kind !== "folder" && (
                    <span style={{ position: "relative" }}>
                      <RowIconButton
                        title="More"
                        data-testid={`file-menu-${entry.path}`}
                        onClick={() =>
                          setMenuFor(menuFor === entry.path ? null : entry.path)
                        }
                      >
                        <DotsIcon size={14} />
                      </RowIconButton>
                      <Popover
                        open={menuFor === entry.path}
                        onClose={() => setMenuFor(null)}
                        minWidth={160}
                        testId={`file-menu-popover-${entry.path}`}
                      >
                        <MenuItem
                          label="Rename…"
                          testId={`rename-file-${entry.path}`}
                          onClick={() => {
                            setMenuFor(null);
                            setRenameTarget(entry.path);
                          }}
                        />
                        <MenuDivider />
                        <MenuItem
                          label="Delete…"
                          danger
                          testId={`delete-file-${entry.path}`}
                          onClick={() => {
                            setMenuFor(null);
                            setDeleteTarget(entry.path);
                          }}
                        />
                      </Popover>
                    </span>
                  )}
                </span>
              </div>
            );
          })}

          <div
            style={{
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "var(--text-3)",
              fontSize: 12.5,
            }}
          >
            <UploadIcon size={14} />
            Drop files anywhere to upload
          </div>
        </div>
      </div>

      <PromptModal
        open={newFileOpen}
        title="New file"
        placeholder="e.g. in.melt"
        confirmLabel="Create"
        mono
        note="Created empty in the working tree — open it to start editing."
        onCancel={() => setNewFileOpen(false)}
        onConfirm={(name) => {
          setNewFileOpen(false);
          void writeFile({ path: name, content: "" });
        }}
      />
      <PromptModal
        open={renameTarget !== null}
        title="Rename file"
        initialValue={renameTarget ?? ""}
        confirmLabel="Rename"
        mono
        onCancel={() => setRenameTarget(null)}
        onConfirm={(name) => {
          const from = renameTarget;
          setRenameTarget(null);
          if (from && name !== from) {
            void renameFile({ from, to: name });
          }
        }}
      />
      <ConfirmModal
        open={deleteTarget !== null}
        title={`Delete ${deleteTarget ?? ""}?`}
        body="The file is removed from the working tree. Snapshots inside existing runs are not affected. This cannot be undone."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          const path = deleteTarget;
          setDeleteTarget(null);
          if (path) {
            void removeFile(path);
          }
        }}
      />
    </div>
  );
};

export default FilesTab;
