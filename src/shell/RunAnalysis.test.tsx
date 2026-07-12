/**
 * The run-detail live analysis section: computes/fixes/variables from a
 * seeded simulationStatus state, scalar values inline, and the figure modal
 * wired through setModifierSyncDataPoints.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, StoreProvider, type Store } from "easy-peasy";

// dygraphs draws on a real canvas; jsdom has none. The graph lifecycle itself
// is covered by Figure.test.tsx — here we assert the wiring around it.
vi.mock("dygraphs", () => {
  const MockDygraph = vi.fn(function (this: {
    updateOptions: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
  }) {
    this.updateOptions = vi.fn();
    this.destroy = vi.fn();
    return this;
  });
  return { default: MockDygraph };
});

import RunAnalysis from "./RunAnalysis";
import { storeModel, type StoreModel } from "../store/model";
import type { StoreInjections } from "../store/projects";
import { createMemoryProjectStorage } from "../storage";
import type { Compute, Fix, Variable } from "../types";
import { ModifierType } from "../types";

function makeEntry(
  name: string,
  overrides: Partial<Compute> = {},
): Compute & Fix & Variable {
  return {
    name,
    type: ModifierType.ComputeOther,
    isPerAtom: false,
    hasScalarData: false,
    scalarValue: 0,
    xLabel: "Time",
    yLabel: "Value",
    clearPerSync: false,
    syncDataPoints: false,
    hasData1D: false,
    lmpCompute: {} as never,
    lmpFix: {} as never,
    lmpVariable: {} as never,
    ...overrides,
  } as Compute & Fix & Variable;
}

describe("RunAnalysis", () => {
  let store: Store<StoreModel>;

  beforeEach(() => {
    const injections: StoreInjections = {
      libraryStorage: createMemoryProjectStorage(),
      scratchStorage: createMemoryProjectStorage(),
    };
    store = createStore(storeModel, { injections });
  });

  const renderPanel = () =>
    render(
      <StoreProvider store={store}>
        <RunAnalysis />
      </StoreProvider>,
    );

  it("shows a placeholder note until the run synchronizes", () => {
    renderPanel();

    expect(screen.getByTestId("run-analysis-section")).toBeInTheDocument();
    expect(
      screen.getByText(/appear once the run synchronizes/),
    ).toBeInTheDocument();
  });

  it("lists computes, fixes and variables with scalar values inline", () => {
    store.getActions().simulationStatus.setComputes({
      msd: makeEntry("msd", { hasData1D: true }),
      temp: makeEntry("temp", { hasScalarData: true, scalarValue: 1.4400012 }),
    });
    store.getActions().simulationStatus.setFixes({
      nve: makeEntry("nve"),
    });
    store.getActions().simulationStatus.setVariables({
      T: makeEntry("T", { hasScalarData: true, scalarValue: 1.44 }),
    });
    renderPanel();

    const section = screen.getByTestId("run-analysis-section");
    expect(section).toHaveTextContent("Computes");
    expect(section).toHaveTextContent("Fixes");
    expect(section).toHaveTextContent("Variables");
    expect(screen.getByTestId("analysis-entry-msd")).toBeInTheDocument();
    expect(screen.getByTestId("analysis-entry-nve")).toBeInTheDocument();
    expect(screen.getByTestId("analysis-entry-T")).toBeInTheDocument();
    // Scalar values render inline with 5 significant digits.
    expect(screen.getByTestId("analysis-entry-temp")).toHaveTextContent(
      "1.4400",
    );
    // No placeholder once entries exist.
    expect(
      screen.queryByText(/appear once the run synchronizes/),
    ).not.toBeInTheDocument();
  });

  it("opens the figure modal for 1D entries and toggles data-point syncing", async () => {
    store.getActions().simulationStatus.setComputes({
      msd: makeEntry("msd", { hasData1D: true }),
    });
    renderPanel();
    const user = userEvent.setup();

    await user.click(screen.getByTestId("analysis-entry-msd"));

    expect(screen.getByTestId("analysis-figure")).toBeInTheDocument();
    // No synced points yet: the token-styled placeholder shows.
    expect(
      screen.getByText(/Waiting for the first synced data points/),
    ).toBeInTheDocument();
    // Opening the figure turns per-timestep data-point syncing on...
    expect(
      store.getState().simulationStatus.computes["msd"].syncDataPoints,
    ).toBe(true);

    // ...and closing it turns it back off.
    await user.click(screen.getByLabelText("Close"));
    expect(screen.queryByTestId("analysis-figure")).not.toBeInTheDocument();
    expect(
      store.getState().simulationStatus.computes["msd"].syncDataPoints,
    ).toBe(false);
  });

  it("does not open a figure for entries without 1D data", async () => {
    store.getActions().simulationStatus.setComputes({
      temp: makeEntry("temp", { hasScalarData: true, scalarValue: 2 }),
    });
    renderPanel();
    const user = userEvent.setup();

    await user.click(screen.getByTestId("analysis-entry-temp"));

    expect(screen.queryByTestId("analysis-figure")).not.toBeInTheDocument();
  });
});
