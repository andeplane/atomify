/**
 * The guided onboarding tour: a first-time user goes from the home screen to
 * a finished simulation and its notebook. Each step highlights one element
 * (driver.js draws the spotlight; see TourController.tsx). Steps either wait
 * for the user to do the thing ("action") or have a Next button ("next").
 *
 * This module is pure so the step logic can be unit tested: the controller
 * builds a TourContext from the store + DOM on every tick and asks
 * `resolveStepIndex` where the tour should be.
 */

export interface TourContext {
  screen: "home" | "examples" | "project";
  tab?: "files" | "runs" | "notebook";
  /** files tab: the file open in the editor. */
  filePath?: string;
  /** runs tab: the run open in the run detail. */
  runId?: string;
  /** The viewed run is the one running right now. */
  runLive: boolean;
  /** The viewed run has ended (completed, failed or stopped). */
  runFinished: boolean;
  /** The project is a temporary quick run (no notebook). */
  quick: boolean;
  /** The New project dialog is open. */
  newProjectOpen: boolean;
  /** Path of the project's input script, when known. */
  inputScript?: string;
}

export interface TourStep {
  id: string;
  title: string;
  body: string;
  /** CSS selector of the element to highlight; none centers the popover. */
  target?: (ctx: TourContext) => string | undefined;
  /** "next": a Next button moves on. "action": the user's click moves on.
   *  "wait": no spotlight, only the floating tour bar (nothing to click). */
  kind: "next" | "action" | "wait";
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  /** The step only shows when this holds (and its target exists). */
  visible?: (ctx: TourContext) => boolean;
  /** The app is already past this step: skip it (and everything before). */
  done?: (ctx: TourContext) => boolean;
  /** When this step can't show but the step with this id can, go back to it
   *  (e.g. the user canceled the dialog this step points at). */
  backTo?: string;
  /** Shown in the tour bar while the step's target is not on screen. */
  hint: string;
}

const viewingRun = (ctx: TourContext) =>
  ctx.screen === "project" && ctx.tab === "runs" && !!ctx.runId;

const runEnded = (ctx: TourContext) => viewingRun(ctx) && ctx.runFinished;

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    kind: "next",
    title: "Welcome to Atomify",
    body:
      "Atomify simulates atoms and molecules right here in your browser, " +
      "using the LAMMPS molecular dynamics engine. Nothing to install. " +
      "This short tour walks you through your first simulation.",
    hint: "",
  },
  {
    id: "use-example",
    kind: "action",
    title: "Start from an example",
    body:
      "Examples are ready-made simulations. Click <b>Use as project</b> to " +
      "copy one into a project of your own that you can edit and run.",
    target: () =>
      '[data-testid="home-screen"] [data-testid^="use-example-"], ' +
      '[data-testid="examples-screen"] [data-testid^="library-use-"]',
    side: "bottom",
    done: (ctx) => ctx.newProjectOpen || ctx.screen === "project",
    hint: "Click Use as project on an example on the Home screen.",
  },
  {
    // The dialog fills the screen, so no spotlight: the tour bar (shown on
    // top of the dialog) says what to do.
    id: "name-project",
    kind: "wait",
    title: "",
    body: "",
    visible: (ctx) => ctx.newProjectOpen,
    done: (ctx) => ctx.screen === "project",
    backTo: "use-example",
    hint: "Name your project (or keep the suggested name) and click Create project.",
  },
  {
    id: "open-script",
    kind: "action",
    title: "Your project's files",
    body:
      "A project is a folder of files. The one marked <b>Input script</b> " +
      "is the recipe for the simulation: which atoms to create and how they " +
      "move. Click it to open it.",
    target: (ctx) =>
      ctx.inputScript
        ? `[data-testid="file-row-${ctx.inputScript}"]`
        : '[data-testid^="file-row-"][data-testid$=".in"]',
    side: "bottom",
    visible: (ctx) =>
      ctx.screen === "project" && ctx.tab === "files" && !ctx.filePath,
    done: (ctx) => !!ctx.filePath || viewingRun(ctx),
    hint: "Open the Files tab of your project to continue.",
  },
  {
    id: "editor",
    kind: "next",
    title: "The input script",
    body:
      "This is a LAMMPS script. Lines starting with <code>#</code> are " +
      "comments that explain each step. You can change values, like the " +
      "temperature. Edits are saved automatically.",
    target: () => '[data-testid="editor-screen"] .monaco-editor',
    side: "left",
    visible: (ctx) => ctx.screen === "project" && !!ctx.filePath,
    done: viewingRun,
    backTo: "open-script",
    hint: "Open the input script in the Files tab to continue.",
  },
  {
    id: "run",
    kind: "action",
    title: "Run the simulation",
    body:
      "Click <b>Save &amp; run simulation</b>. It saves your edits and starts " +
      "the simulation in your browser. The button is enabled once the engine " +
      "has loaded.",
    target: () => '[data-testid="run-simulation"]',
    side: "bottom",
    visible: (ctx) => ctx.screen === "project",
    done: viewingRun,
    hint: "Open your project and click Save & run simulation.",
  },
  {
    id: "viewport",
    kind: "next",
    title: "Watch it live",
    body:
      "The atoms move as the simulation runs. Drag to rotate, scroll to " +
      "zoom, and right-drag to pan.",
    target: () => '[data-testid="run-viewport"]',
    side: "left",
    visible: (ctx) => viewingRun(ctx) && ctx.runLive,
    done: runEnded,
    hint: "Open the running simulation in the Runs tab to continue.",
  },
  {
    id: "speed",
    kind: "next",
    title: "Simulation speed",
    body:
      "Speed sets how many timesteps run between screen updates. Slide it " +
      "up to get through the simulation faster, at the cost of a choppier " +
      "animation.",
    target: () => '[data-tour="simulation-speed"]',
    side: "left",
    visible: (ctx) => viewingRun(ctx) && ctx.runLive,
    done: runEnded,
    hint: "Open the running simulation in the Runs tab to continue.",
  },
  {
    id: "analysis",
    kind: "next",
    title: "Live measurements",
    body:
      "Computes, fixes and variables are quantities the script measures " +
      "while it runs, like temperature, pressure or how far atoms have " +
      "moved. Click a name with a chart icon to plot it live.",
    target: () => '[data-testid="run-analysis-section"]',
    side: "left",
    visible: (ctx) => viewingRun(ctx) && ctx.runLive,
    done: runEnded,
    hint: "Open the running simulation in the Runs tab to continue.",
  },
  {
    id: "view-controls",
    kind: "next",
    title: "Change the view",
    body:
      "<b>Color atoms</b> colors them by type or by a measured property. " +
      "<b>Images</b> repeats the periodic box so you see the neighboring " +
      "copies. <b>Slice</b> cuts the system open so you can look inside.",
    target: () => '[data-tour="view-controls"]',
    side: "bottom",
    visible: (ctx) => viewingRun(ctx) && ctx.runLive,
    done: runEnded,
    hint: "Open the running simulation in the Runs tab to continue.",
  },
  {
    id: "wait",
    kind: "wait",
    title: "",
    body: "",
    done: runEnded,
    hint: "The simulation is running. The tour continues when it finishes.",
  },
  {
    id: "notebook",
    kind: "action",
    title: "Analyze the results",
    body:
      "The run is finished and its output files are saved in the project. " +
      "Click <b>Analyze in notebook</b> to open a Python notebook, " +
      "with the results ready to plot.",
    target: () => '[data-testid="analyze-in-notebook"]',
    side: "bottom",
    visible: runEnded,
    done: (ctx) => ctx.screen === "project" && ctx.tab === "notebook",
    hint: "Open the finished run in the Runs tab to continue.",
  },
  {
    id: "finish",
    kind: "next",
    title: "You're all set",
    body:
      "That's the basics: pick an example, edit the script, run it and " +
      "analyze it. Open this tour again any time from <b>Take the tour</b>.",
    target: () => '[data-testid="sidebar-tour"]',
    side: "right",
    align: "end",
    hint: "",
  },
];

/** Whether a step can be shown right now (its target, if any, is on screen). */
export function isPresentable(
  step: TourStep,
  ctx: TourContext,
  exists: (selector: string) => boolean,
): boolean {
  if (step.kind === "wait") {
    return false;
  }
  if (step.visible && !step.visible(ctx)) {
    return false;
  }
  const selector = step.target?.(ctx);
  return selector === undefined || exists(selector);
}

/**
 * Where the tour should be, given where it was and the app's state: skip
 * past steps the user has already done (they may click ahead of the tour),
 * and step back when an action step lost its target but its `backTo` step
 * can show (e.g. the dialog was canceled). Never moves backwards otherwise.
 */
export function resolveStepIndex(
  index: number,
  ctx: TourContext,
  exists: (selector: string) => boolean,
  steps: TourStep[] = TOUR_STEPS,
): number {
  let next = index;
  for (let k = steps.length - 1; k >= index; k--) {
    if (steps[k].done?.(ctx)) {
      next = k + 1;
      break;
    }
  }
  // A quick run has no notebook: there is nothing after the run to point at.
  if (steps[next]?.id === "notebook" && ctx.quick && runEnded(ctx)) {
    next += 1;
  }
  const step = steps[next];
  if (step?.backTo && !isPresentable(step, ctx, exists)) {
    const back = steps.findIndex((candidate) => candidate.id === step.backTo);
    if (
      back >= 0 &&
      back < next &&
      !steps[back].done?.(ctx) &&
      isPresentable(steps[back], ctx, exists)
    ) {
      next = back;
    }
  }
  return Math.min(next, steps.length);
}
