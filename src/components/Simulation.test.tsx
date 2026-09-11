import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import Simulation from "./Simulation";
import { useStoreActions, useStoreState } from "../hooks";
import type { Actions, State } from "easy-peasy";
import type { StoreModel } from "../store/model";

vi.mock("../hooks", () => ({
  useStoreActions: vi.fn(),
  useStoreState: vi.fn(),
}));
vi.mock("../wasm/LammpsWorkerProxy", () => ({ LammpsWorkerProxy: vi.fn() }));
vi.mock("../wasm/wasmInstance", () => ({
  getWasmOrNull: () => ({}),
  setPausedFlag: vi.fn(),
}));
vi.mock("../utils/metrics", () => ({ track: vi.fn(), time_event: vi.fn() }));
vi.mock("antd", () => ({ notification: { info: vi.fn() } }));

const setSpeed = vi.fn();
const setPaused = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  const state = {
    app: { selectedMenu: "view" },
    simulation: { running: true, paused: true },
    settings: { simulation: { speed: 1 } },
  } as unknown as State<StoreModel>;
  const actions = {
    app: {},
    processing: {},
    simulationStatus: {},
    simulation: { setPaused },
    settings: { setSimulation: setSpeed },
  } as unknown as Actions<StoreModel>;
  vi.mocked(useStoreState).mockImplementation((select) => select(state));
  vi.mocked(useStoreActions).mockImplementation((select) => select(actions));
});

describe("simulation keyboard shortcuts", () => {
  it.each(["input", "textarea", "select", "button"])(
    "does not change speed or pause while using %s",
    (tag) => {
      render(<Simulation />);
      const control = document.createElement(tag);
      document.body.append(control);
      fireEvent.keyDown(control, { key: "9" });
      fireEvent.keyDown(control, { key: " " });
      expect(setSpeed).not.toHaveBeenCalled();
      expect(setPaused).not.toHaveBeenCalled();
      control.remove();
    },
  );

  it("ignores text inside editable ancestors and modal focus gaps", () => {
    const { getByText, getByRole } = render(
      <>
        <Simulation />
        <div contentEditable suppressContentEditableWarning>
          <span>Editor</span>
        </div>
        <div role="dialog" aria-modal="true" />
      </>,
    );
    fireEvent.keyDown(getByText("Editor"), { key: "9" });
    fireEvent.keyDown(window, { key: "9" });
    expect(setSpeed).not.toHaveBeenCalled();
    getByRole("dialog").setAttribute("aria-modal", "false");
    fireEvent.keyDown(getByText("Editor"), { key: "9" });
    expect(setSpeed).not.toHaveBeenCalled();
  });

  it.each([
    { ctrlKey: true },
    { metaKey: true },
    { altKey: true },
    { repeat: true },
    { isComposing: true },
  ])("ignores modified, repeated and composing keys: %j", (flags) => {
    render(<Simulation />);
    fireEvent.keyDown(window, { key: "9", ...flags });
    expect(setSpeed).not.toHaveBeenCalled();
  });

  it("keeps viewport speed and pause shortcuts working and prevents space scrolling", () => {
    render(<Simulation />);
    fireEvent.keyDown(window, { key: "9" });
    expect(setSpeed).toHaveBeenCalledWith({ speed: 200 });
    const event = new KeyboardEvent("keydown", { key: " ", cancelable: true });
    window.dispatchEvent(event);
    expect(setPaused).toHaveBeenCalledWith(false);
    expect(event.defaultPrevented).toBe(true);
  });
});
