/**
 * Cross-screen UI services for the shell: modal openers, the run launcher,
 * and the shared example-library data. Provided by Shell.tsx.
 */

import { createContext, useContext } from "react";
import type { NotificationInstance } from "antd/es/notification/interface";
import type { Example, ExamplesData } from "../hooks/useExamples";

export type SettingsTab = "general" | "rendering" | "storage";

export interface ShellUI {
  /**
   * Hook-based antd notification instance. antd v5's STATIC notification
   * functions don't render under React 19 — always toast through this.
   */
  notify: NotificationInstance;
  openNewProject: (exampleId?: string) => void;
  openSettings: (tab?: SettingsTab) => void;
  openDeleteProject: (dirName: string) => void;
  openRename: () => void;
  /** New Run modal; choosingInput starts on the input-script chooser. */
  openNewRun: (options?: { choosingInput?: boolean }) => void;
  quickRunExample: (example: Example) => void;
  useExampleAsProject: (example: Example) => void;
  /** Header Run button: resolves the input script per ADR-003 §4.4. */
  runProject: () => Promise<void>;
  /** One-off "Run this file" — does not change the designated input script. */
  runFile: (path: string) => Promise<void>;
  /** Re-run a finished run with its recorded script + vars. */
  runAgain: (
    inputScript: string,
    vars: Record<string, number>,
  ) => Promise<void>;
  stopRun: () => void;
  engineReady: boolean;
  examples: ExamplesData;
}

export const ShellUIContext = createContext<ShellUI | null>(null);

export function useShellUI(): ShellUI {
  const context = useContext(ShellUIContext);
  if (!context) {
    throw new Error("useShellUI must be used inside the Shell");
  }
  return context;
}
