import { useEffect } from "react";
import { notification } from "antd";
import type { NotificationInstance } from "antd/es/notification/interface";
import { useStoreState, useStoreActions } from "./index";

/**
 * Watches simulation error/warning state and renders Ant Design notifications.
 * Call once in a top-level component (e.g. App).
 *
 * Pass a hook-based NotificationInstance where available (the new shell):
 * antd v5's static notification functions don't render under React 19. The
 * embedded shell keeps the static fallback (its legacy behavior).
 */
export function useSimulationNotifications(api?: NotificationInstance): void {
  const lastError = useStoreState((s) => s.simulation.lastError);
  const lastWarning = useStoreState((s) => s.simulation.lastWarning);
  const setLastError = useStoreActions((a) => a.simulation.setLastError);
  const setLastWarning = useStoreActions((a) => a.simulation.setLastWarning);

  useEffect(() => {
    if (lastError) {
      (api ?? notification).error({ message: lastError, duration: 5 });
      setLastError(undefined);
    }
  }, [lastError, setLastError, api]);

  useEffect(() => {
    if (lastWarning) {
      (api ?? notification).warning({ message: lastWarning });
      setLastWarning(undefined);
    }
  }, [lastWarning, setLastWarning, api]);
}
