import { useEffect } from "react";
import { notification } from "antd";
import { useStoreState, useStoreActions } from "./index";

/**
 * Watches simulation error/warning state and renders Ant Design notifications.
 * Call once in a top-level component (e.g. App).
 */
export function useSimulationNotifications(): void {
  const lastError = useStoreState((s) => s.simulation.lastError);
  const lastWarning = useStoreState((s) => s.simulation.lastWarning);
  const setLastError = useStoreActions((a) => a.simulation.setLastError);
  const setLastWarning = useStoreActions((a) => a.simulation.setLastWarning);

  useEffect(() => {
    if (lastError) {
      notification.error({ message: lastError, duration: 5 });
      setLastError(undefined);
    }
  }, [lastError, setLastError]);

  useEffect(() => {
    if (lastWarning) {
      notification.warning({ message: lastWarning });
      setLastWarning(undefined);
    }
  }, [lastWarning, setLastWarning]);
}
