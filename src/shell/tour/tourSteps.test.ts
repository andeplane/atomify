import { describe, expect, it } from "vitest";
import {
  isPresentable,
  resolveStepIndex,
  TOUR_STEPS,
  type TourContext,
} from "./tourSteps";

const at = (id: string) => TOUR_STEPS.findIndex((step) => step.id === id);
const always = () => true;
const never = () => false;

const home: TourContext = {
  screen: "home",
  runLive: false,
  runFinished: false,
  quick: false,
  newProjectOpen: false,
};

const project = (extra: Partial<TourContext> = {}): TourContext => ({
  ...home,
  screen: "project",
  tab: "files",
  inputScript: "simple_diffusion.in",
  ...extra,
});

const liveRun = project({ tab: "runs", runId: "run-001", runLive: true });
const finishedRun = project({
  tab: "runs",
  runId: "run-001",
  runFinished: true,
});

describe("onboarding tour steps", () => {
  it("starts with a welcome and ends pointing at the replay button", () => {
    expect(TOUR_STEPS[0].id).toBe("welcome");
    expect(TOUR_STEPS.at(-1)?.target?.(home)).toBe(
      '[data-testid="sidebar-tour"]',
    );
  });

  it("follows the happy path as the user clicks through", () => {
    let index = at("use-example");
    expect(resolveStepIndex(index, home, always)).toBe(at("use-example"));

    index = resolveStepIndex(index, { ...home, newProjectOpen: true }, always);
    expect(TOUR_STEPS[index].id).toBe("name-project");

    index = resolveStepIndex(index, project(), always);
    expect(TOUR_STEPS[index].id).toBe("open-script");

    index = resolveStepIndex(
      index,
      project({ filePath: "simple_diffusion.in" }),
      always,
    );
    expect(TOUR_STEPS[index].id).toBe("editor");

    // "editor" is a Next step: the user moves on with the button.
    index = resolveStepIndex(
      index + 1,
      project({ filePath: "simple_diffusion.in" }),
      always,
    );
    expect(TOUR_STEPS[index].id).toBe("run");

    index = resolveStepIndex(index, liveRun, always);
    expect(TOUR_STEPS[index].id).toBe("viewport");

    index = resolveStepIndex(index, finishedRun, always);
    expect(TOUR_STEPS[index].id).toBe("notebook");

    index = resolveStepIndex(index, project({ tab: "notebook" }), always);
    expect(TOUR_STEPS[index].id).toBe("finish");
  });

  it("skips ahead when the user starts a run before the tour gets there", () => {
    expect(resolveStepIndex(at("open-script"), liveRun, always)).toBe(
      at("viewport"),
    );
  });

  it("goes back to Use as project when the dialog is canceled", () => {
    expect(resolveStepIndex(at("name-project"), home, always)).toBe(
      at("use-example"),
    );
    // While the dialog is open, the tour bar explains it (no spotlight).
    const open = { ...home, newProjectOpen: true };
    expect(resolveStepIndex(at("name-project"), open, always)).toBe(
      at("name-project"),
    );
    expect(isPresentable(TOUR_STEPS[at("name-project")], open, always)).toBe(
      false,
    );
  });

  it("goes back to the file list when the editor is closed", () => {
    expect(resolveStepIndex(at("editor"), project(), always)).toBe(
      at("open-script"),
    );
  });

  it("does not go backwards when the user wanders off mid-run", () => {
    expect(resolveStepIndex(at("speed"), home, always)).toBe(at("speed"));
  });

  it("waits for the run to finish after the live steps", () => {
    const wait = TOUR_STEPS[at("wait")];
    expect(isPresentable(wait, liveRun, always)).toBe(false);
    expect(resolveStepIndex(at("wait"), liveRun, always)).toBe(at("wait"));
    expect(resolveStepIndex(at("wait"), finishedRun, always)).toBe(
      at("notebook"),
    );
  });

  it("skips the notebook step for a quick run", () => {
    expect(
      resolveStepIndex(at("wait"), { ...finishedRun, quick: true }, always),
    ).toBe(at("finish"));
  });

  it("only shows a step when its element is on screen", () => {
    const step = TOUR_STEPS[at("use-example")];
    expect(isPresentable(step, home, always)).toBe(true);
    expect(isPresentable(step, home, never)).toBe(false);
    // The welcome step has no target: always presentable.
    expect(isPresentable(TOUR_STEPS[0], project(), never)).toBe(true);
  });

  it("points at the project's input script", () => {
    expect(TOUR_STEPS[at("open-script")].target?.(project())).toBe(
      '[data-testid="file-row-simple_diffusion.in"]',
    );
  });
});
