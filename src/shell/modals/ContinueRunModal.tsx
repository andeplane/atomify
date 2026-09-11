import { useState } from "react";
import { useStoreActions } from "../../hooks";
import type { RunMeta } from "../../storage";
import { validContinuationSteps } from "../../utils/continuation";
import { ModalShell, PrimaryButton } from "../ui";

export default function ContinueRunModal({
  meta,
  onClose,
}: {
  meta: RunMeta;
  onClose: () => void;
}) {
  const [steps, setSteps] = useState(1000);
  const startRuns = useStoreActions((a) => a.projects.startRuns);
  return (
    <ModalShell
      open
      onClose={onClose}
      title="Continue simulation"
      testId="continue-run-modal"
    >
      <div style={{ padding: 24, display: "grid", gap: 16 }}>
        <p>
          Advance the loaded atoms from step{" "}
          {meta.stats?.timesteps?.toLocaleString() ?? "—"}. Results are saved as
          a new run linked to this one.
        </p>
        <label>
          Additional timesteps
          <input
            className="shell-input"
            aria-label="Additional timesteps"
            type="number"
            min={1}
            max={2147483647}
            step={1}
            value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
          />
        </label>
        <PrimaryButton
          disabled={!validContinuationSteps(steps)}
          onClick={() => {
            onClose();
            void startRuns([
              {
                inputScript: meta.inputScript,
                vars: meta.vars ?? {},
                useKokkos: false,
                threads: 1,
                continueFrom: { runId: meta.id, steps },
              },
            ]);
          }}
        >
          Continue
        </PrimaryButton>
      </div>
    </ModalShell>
  );
}
