/**
 * Delete project (ADR-003 §5): the confirm states run count and total size,
 * and deletion is blocked while the project has a live run.
 */

import { useEffect, useState } from "react";
import { useStoreActions, useStoreState } from "../../hooks";
import { formatBytes } from "../format";
import { WarningIcon } from "../icons";
import { DangerButton, GhostButton, ModalShell } from "../ui";

const DeleteProjectModal = ({
  dirName,
  onClose,
}: {
  dirName: string | null;
  onClose: () => void;
}) => {
  const projects = useStoreState((state) => state.projects.projects);
  const activeRun = useStoreState((state) => state.projects.activeRun);
  const deleteProject = useStoreActions(
    (actions) => actions.projects.deleteProject,
  );
  const projectSizes = useStoreActions(
    (actions) => actions.projects.projectSizes,
  );

  const [size, setSize] = useState<{ bytes: number; runs: number } | null>(
    null,
  );

  useEffect(() => {
    if (!dirName) {
      return;
    }
    let mounted = true;
    setSize(null);
    projectSizes()
      .then((sizes) => {
        if (mounted && sizes[dirName]) {
          setSize(sizes[dirName]);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [dirName, projectSizes]);

  const project = projects.find((p) => p.dirName === dirName);
  if (!dirName || !project) {
    return null;
  }
  const blocked = activeRun?.dirName === dirName;

  return (
    <ModalShell
      open
      onClose={onClose}
      maxWidth={420}
      testId="delete-project-modal"
    >
      <div style={{ padding: "20px 22px 22px" }}>
        <h3
          style={{
            margin: "0 0 6px",
            fontSize: 17,
            fontWeight: 700,
            color: "var(--text)",
          }}
        >
          Delete “{project.displayName}”?
        </h3>
        {blocked ? (
          <div
            data-testid="delete-blocked"
            style={{
              display: "flex",
              gap: 9,
              alignItems: "flex-start",
              padding: "11px 13px",
              borderRadius: 10,
              background: "var(--bad-soft)",
              fontSize: 12.5,
              color: "var(--text)",
              lineHeight: 1.5,
              margin: "10px 0 18px",
            }}
          >
            <span style={{ color: "var(--bad)", flexShrink: 0, marginTop: 1, display: "flex" }}>
              <WarningIcon />
            </span>
            This project has a run in progress — stop it before deleting.
          </div>
        ) : (
          <p
            data-testid="delete-summary"
            style={{
              margin: "0 0 18px",
              fontSize: 13,
              color: "var(--text-2)",
              lineHeight: 1.6,
            }}
          >
            {size
              ? `Deletes ${size.runs} ${size.runs === 1 ? "run" : "runs"} and ${formatBytes(size.bytes)} of storage. This cannot be undone.`
              : "Deletes the project's working tree and all recorded runs. This cannot be undone."}
          </p>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          {!blocked && (
            <DangerButton
              data-testid="delete-project-confirm"
              onClick={() => {
                onClose();
                void deleteProject(dirName);
              }}
            >
              Delete project
            </DangerButton>
          )}
        </div>
      </div>
    </ModalShell>
  );
};

export default DeleteProjectModal;
