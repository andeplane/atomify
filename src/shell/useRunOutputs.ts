/**
 * The persisted record a run detail shows: for a finished run the log, the
 * final frame (as an object URL) and the output files from storage; for a
 * live run the output files, polled while the run writes them.
 */

import { useEffect, useState } from "react";
import { useStoreActions } from "../hooks";
import type { FileStat } from "../storage";

export function useRunOutputs({
  live,
  dirName,
  runId,
}: {
  live: boolean;
  dirName: string | undefined;
  runId: string;
}) {
  const readFile = useStoreActions((actions) => actions.projects.readFile);
  const readFileRaw = useStoreActions(
    (actions) => actions.projects.readFileRaw,
  );
  const listFiles = useStoreActions((actions) => actions.projects.listFiles);
  const [log, setLog] = useState<string[] | null>(null);
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<FileStat[]>([]);

  // Finished runs: persisted log + frame + output list from storage.
  useEffect(() => {
    if (live || !dirName) {
      return;
    }
    let mounted = true;
    let objectUrl: string | null = null;
    (async () => {
      const [logText, frame, files] = await Promise.all([
        readFile(`runs/${runId}/log.lammps`).catch(() => ""),
        readFileRaw({ path: `runs/${runId}/.atomify/frame.png` }),
        listFiles({ subdir: `runs/${runId}` }),
      ]);
      if (!mounted) {
        return;
      }
      setLog(logText ? logText.split("\n") : []);
      if (frame instanceof Uint8Array && frame.length > 0) {
        const bytes = new Uint8Array(frame);
        objectUrl = URL.createObjectURL(
          new Blob([bytes.buffer as ArrayBuffer], { type: "image/png" }),
        );
        setFrameUrl(objectUrl);
      } else {
        setFrameUrl(null);
      }
      setOutputs(
        files.filter(
          (file) =>
            file.type !== "directory" && !file.path.includes("/.atomify"),
        ),
      );
    })().catch(() => {});
    return () => {
      mounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [live, dirName, runId, readFile, readFileRaw, listFiles]);

  // Live runs: list outputs on an interval so the panel fills in as the
  // mid-run copies land.
  useEffect(() => {
    if (!live || !dirName) {
      return;
    }
    let mounted = true;
    const refresh = () => {
      listFiles({ subdir: `runs/${runId}` })
        .then((files) => {
          if (mounted) {
            setOutputs(
              files.filter(
                (file) =>
                  file.type !== "directory" && !file.path.includes("/.atomify"),
              ),
            );
          }
        })
        .catch(() => {});
    };
    refresh();
    const interval = setInterval(refresh, 4000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [live, dirName, runId, listFiles]);

  return { log, frameUrl, outputs };
}
