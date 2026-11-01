/**
 * Runs the onboarding tour (tourSteps.ts) on top of the shell. driver.js
 * draws the spotlight + popover; this component decides which step shows by
 * polling the store and the DOM, so the tour follows the user's real clicks
 * (and copes with them clicking ahead, canceling a dialog or wandering off).
 * When the current step's element is not on screen, a small tour bar at the
 * bottom says what to do next and offers to end the tour.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./tour.css";
import { useStore } from "../../hooks";
import { track } from "../../utils/metrics";
import {
  isPresentable,
  resolveStepIndex,
  TOUR_STEPS,
  type TourContext,
} from "./tourSteps";

const TICK_MS = 250;

const exists = (selector: string) => document.querySelector(selector) !== null;

/** Steps the user sees as numbered (the "wait" step is not one). */
const NUMBERED = TOUR_STEPS.filter((step) => step.kind !== "wait");

const TourController = ({ onEnd }: { onEnd: () => void }) => {
  const store = useStore();
  const indexRef = useRef(0);
  const driverRef = useRef<Driver | null>(null);
  const shownRef = useRef<{ id: string; element: Element | null } | null>(null);
  const rectRef = useRef("");
  const [hint, setHint] = useState<string | null>(null);
  // Over a dialog the bar moves to the top, clear of the dialog's buttons.
  const [barOnTop, setBarOnTop] = useState(false);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  const buildContext = useCallback((): TourContext => {
    const state = store.getState();
    const screen = state.projects.screen;
    const active = state.projects.active;
    const activeRun = state.projects.activeRun;
    if (screen.name !== "project") {
      return {
        screen: screen.name,
        runLive: false,
        runFinished: false,
        quick: false,
        newProjectOpen: exists('[data-testid="new-project-modal"]'),
      };
    }
    const runLive =
      !!screen.runId &&
      activeRun?.runId === screen.runId &&
      activeRun?.dirName === screen.dirName;
    const runMeta = active?.runs.find(
      (run) => run.runId === screen.runId,
    )?.meta;
    return {
      screen: "project",
      tab: screen.tab,
      filePath: screen.filePath,
      runId: screen.runId,
      runLive,
      runFinished:
        !!screen.runId && !runLive && !!runMeta && runMeta.status !== "running",
      quick: active?.quick ?? false,
      newProjectOpen: exists('[data-testid="new-project-modal"]'),
      inputScript: active?.meta.inputScript,
    };
  }, [store]);

  const hideSpotlight = useCallback(() => {
    shownRef.current = null;
    if (driverRef.current?.isActive()) {
      driverRef.current.destroy();
    }
  }, []);

  const end = useCallback(
    (completed: boolean) => {
      track(completed ? "Tour.Complete" : "Tour.Skip", {
        step: TOUR_STEPS[indexRef.current]?.id ?? "end",
      });
      hideSpotlight();
      onEndRef.current();
    },
    [hideSpotlight],
  );

  const tick = useCallback(() => {
    const ctx = buildContext();
    const index = resolveStepIndex(indexRef.current, ctx, exists);
    indexRef.current = index;
    const step = TOUR_STEPS[index];
    if (!step) {
      end(true);
      return;
    }
    if (!isPresentable(step, ctx, exists)) {
      hideSpotlight();
      setHint(step.hint || null);
      setBarOnTop(ctx.newProjectOpen);
      return;
    }
    setHint(null);
    const selector = step.target?.(ctx);
    const element = selector ? document.querySelector(selector) : null;
    const drv = driverRef.current;
    if (!drv) {
      return;
    }
    const shown = shownRef.current;
    if (shown && shown.id === step.id && shown.element === element) {
      // Same step and node: follow layout changes (projects and example
      // cards loading in above the target, panels growing, etc.).
      // driver.js ignores refresh() while its highlight animation runs and
      // places the popover mid-animation, so a layout shift during that
      // window leaves the popover behind. Wait for the animation to end,
      // then re-place whenever the target's box differs from the last place.
      if (drv.getState("__transitionCallback")) {
        return;
      }
      if (!element) {
        return;
      }
      const rect = element.getBoundingClientRect();
      const key = `${Math.round(rect.x)},${Math.round(rect.y)},${Math.round(rect.width)},${Math.round(rect.height)}`;
      if (key !== rectRef.current) {
        const firstPlacement = rectRef.current === "";
        rectRef.current = key;
        // Bring a target the shift pushed off screen back into view once;
        // later on, leave the user's scrolling alone.
        if (
          firstPlacement &&
          (rect.bottom > window.innerHeight || rect.top < 0)
        ) {
          element.scrollIntoView({ block: "center" });
        }
        drv.refresh();
      }
      return;
    }
    shownRef.current = { id: step.id, element };
    rectRef.current = "";
    const number = NUMBERED.indexOf(step) + 1;
    const last = number === NUMBERED.length;
    drv.highlight({
      element: element ?? undefined,
      popover: {
        title: step.title,
        description: step.body,
        side: step.side,
        align: step.align ?? "start",
        showButtons:
          step.kind === "next" ? ["previous", "next", "close"] : ["close"],
        disableButtons: [],
        showProgress: true,
        progressText: `${number} of ${NUMBERED.length}`,
        prevBtnText: "Skip tour",
        nextBtnText: index === 0 ? "Start" : last ? "Finish" : "Next",
        onNextClick: () => {
          indexRef.current = index + 1;
          tickRef.current();
        },
        onPrevClick: () => end(false),
        onCloseClick: () => end(false),
      },
    });
  }, [buildContext, end, hideSpotlight]);

  const tickRef = useRef(tick);
  tickRef.current = tick;

  useEffect(() => {
    track("Tour.Start");
    driverRef.current = driver({
      animate: true,
      allowClose: true,
      overlayClickBehavior: "none",
      // Escape would also close the shell's dialogs underneath.
      allowKeyboardControl: false,
      overlayColor: "#04060a",
      overlayOpacity: 0.6,
      stagePadding: 6,
      stageRadius: 10,
      popoverClass: "atomify-tour",
      popoverOffset: 12,
    });
    tickRef.current();
    const timer = window.setInterval(() => tickRef.current(), TICK_MS);
    return () => {
      window.clearInterval(timer);
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, []);

  if (!hint) {
    return null;
  }
  return (
    <div
      className={`atomify-tour-bar${barOnTop ? " atomify-tour-bar--top" : ""}`}
      data-testid="tour-bar"
      role="status"
    >
      <span className="atomify-tour-bar-label">Tour</span>
      <span style={{ flex: 1 }}>{hint}</span>
      <button
        onClick={() => end(false)}
        data-testid="tour-end"
        className="atomify-tour-bar-end"
      >
        End tour
      </button>
    </div>
  );
};

export default TourController;
