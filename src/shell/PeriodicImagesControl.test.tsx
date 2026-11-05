import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PeriodicImagesControl from "./PeriodicImagesControl";
import SyncParticlesModifier from "../modifiers/syncparticlesmodifier";
import type { ImageCounts } from "../modifiers/periodicImages";

vi.mock("../modifiers/syncparticlesmodifier", () => ({
  default: class {
    periodicImages: ImageCounts = [1, 1, 1];
  },
}));

const engine = vi.hoisted(() => ({ modifiers: [] as unknown[] }));
const runPostTimestepRendering = vi.hoisted(() => vi.fn());

vi.mock("../hooks", () => ({
  useEngine: () => engine,
  useStoreState: (selector: (state: unknown) => unknown) =>
    selector({ simulationStatus: { numAtoms: 10 } }),
  useStoreActions: (selector: (actions: unknown) => unknown) =>
    selector({
      processing: { runPostTimestepRendering, runPostTimestep: vi.fn() },
    }),
}));

describe("PeriodicImagesControl", () => {
  let modifier: SyncParticlesModifier;

  beforeEach(() => {
    runPostTimestepRendering.mockClear();
    modifier = new SyncParticlesModifier({ name: "Particles", active: true });
    modifier.periodicImages = [2, 1, 1];
    engine.modifiers = [modifier];
  });

  const openAxisX = async () => {
    const user = userEvent.setup();
    render(<PeriodicImagesControl live />);
    await user.click(screen.getByTestId("periodic-images"));
    return { user, input: screen.getByLabelText("Images along x") };
  };

  it("replaces a count by backspacing and typing a new digit", async () => {
    // Arrange
    const { user, input } = await openAxisX();

    // Act
    await user.type(input, "{Backspace}3");

    // Assert: the cleared field never committed a 1, so no "13"
    expect(input).toHaveValue(3);
    expect(modifier.periodicImages).toEqual([3, 1, 1]);
    expect(screen.getByTestId("periodic-images")).toHaveTextContent(
      "Images 3×1×1",
    );
  });

  it("reverts an emptied field to the current count on blur", async () => {
    // Arrange
    const { user, input } = await openAxisX();

    // Act
    await user.type(input, "{Backspace}");
    expect(input).toHaveValue(null);
    await user.tab();

    // Assert
    expect(input).toHaveValue(2);
    expect(modifier.periodicImages).toEqual([2, 1, 1]);
    expect(runPostTimestepRendering).not.toHaveBeenCalled();
  });
});
