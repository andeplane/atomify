/**
 * Rename project (ADR-003 §5): edits displayName only — the folder name is
 * immutable so notebook paths never break.
 */

import { useStoreActions, useStoreState } from "../../hooks";
import { MONO, PromptModal } from "../ui";

const RenameModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const active = useStoreState((state) => state.projects.active);
  const renameProject = useStoreActions(
    (actions) => actions.projects.renameProject,
  );

  if (!active) {
    return null;
  }

  return (
    <PromptModal
      open={open}
      title="Rename project"
      initialValue={active.meta.displayName}
      confirmLabel="Save"
      note={
        <>
          Folder name stays{" "}
          <span style={{ fontFamily: MONO, color: "var(--text-2)" }}>
            {active.meta.dirName}/
          </span>{" "}
          so notebook paths never break.
        </>
      }
      onCancel={onClose}
      onConfirm={(name) => {
        onClose();
        if (name !== active.meta.displayName) {
          void renameProject(name);
        }
      }}
    />
  );
};

export default RenameModal;
