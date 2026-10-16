import { useEffect, useState } from "react";
import { useStoreActions, useStoreState } from "../../hooks";
import {
  dataFileAtomStyle,
  dataFileViewerScript,
} from "../../utils/dataFileViewer";
import { ModalShell, PrimaryButton } from "../ui";

export default function ViewDataModal({
  path,
  onClose,
}: {
  path: string | null;
  onClose: () => void;
}) {
  const [atomStyle, setAtomStyle] = useState("atomic");
  const [units, setUnits] = useState("real");
  const [error, setError] = useState<string>();
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const active = useStoreState((s) => s.projects.active);
  const readFile = useStoreActions((a) => a.projects.readFile);
  const writeFile = useStoreActions((a) => a.projects.writeFile);
  const startRuns = useStoreActions((a) => a.projects.startRuns);
  useEffect(() => {
    let current = true;
    setError(undefined);
    setLoaded(false);
    setUnits("real");
    setAtomStyle("atomic");
    if (path)
      void readFile(path)
        .then((text) => {
          if (current) {
            setAtomStyle(dataFileAtomStyle(text));
            setLoaded(true);
          }
        })
        .catch((e) => {
          if (current) setError(String(e));
        });
    return () => {
      current = false;
    };
  }, [path, readFile]);
  const view = async () => {
    if (!path || !active || busy) return;
    setBusy(true);
    try {
      const content = dataFileViewerScript(path, atomStyle, units);
      let name = "in.view-data";
      let suffix = 2;
      while (active.files.some((f) => f.path === name))
        name = `in.view-data-${suffix++}`;
      await writeFile({ path: name, content });
      onClose();
      await startRuns([
        {
          inputScript: name,
          vars: {},
          useKokkos: false,
          threads: 1,
          viewOnly: true,
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <ModalShell
      open={path !== null}
      onClose={onClose}
      title="View data file"
      testId="view-data-modal"
    >
      <div style={{ padding: 24, display: "grid", gap: 16 }}>
        <p>
          View {path} without integrating any timesteps. Select the atom style
          and units used when the file was written. Force-field coefficients are
          ignored.
        </p>
        <label>
          Atom style
          <input
            aria-label="Atom style"
            className="shell-input"
            value={atomStyle}
            onChange={(e) => setAtomStyle(e.target.value)}
          />
        </label>
        <label>
          Units
          <select
            aria-label="Units"
            className="shell-input"
            value={units}
            onChange={(e) => setUnits(e.target.value)}
          >
            {[
              "lj",
              "real",
              "metal",
              "si",
              "cgs",
              "electron",
              "micro",
              "nano",
            ].map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </label>
        {error && <p role="alert">{error}</p>}
        <PrimaryButton disabled={busy || !loaded} onClick={() => void view()}>
          {busy ? "Loading…" : "View structure"}
        </PrimaryButton>
      </div>
    </ModalShell>
  );
}
