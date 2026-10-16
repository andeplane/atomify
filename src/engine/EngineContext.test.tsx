import { describe, it, expect, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import type { Visualizer } from "omovi";
import { EngineContext, useEngine, useEngineState } from "./EngineContext";
import { EngineRegistry } from "./EngineRegistry";

function VisualizerName({ onRender }: { onRender: () => void }) {
  onRender();
  const visualizer = useEngineState((objects) => objects.visualizer);
  return (
    <div data-testid="name">
      {(visualizer as unknown as { name?: string } | undefined)?.name ?? "none"}
    </div>
  );
}

describe("EngineContext", () => {
  it("re-renders a component when its selected object is replaced", () => {
    const engine = new EngineRegistry([]);
    const onRender = vi.fn();
    render(
      <EngineContext.Provider value={engine}>
        <VisualizerName onRender={onRender} />
      </EngineContext.Provider>,
    );
    expect(screen.getByTestId("name")).toHaveTextContent("none");

    act(() => engine.setVisualizer({ name: "first" } as unknown as Visualizer));
    expect(screen.getByTestId("name")).toHaveTextContent("first");

    // Another object changing leaves this component alone.
    const renders = onRender.mock.calls.length;
    act(() => engine.setLammps({} as never));
    expect(onRender.mock.calls.length).toBe(renders);

    act(() => engine.setVisualizer(undefined));
    expect(screen.getByTestId("name")).toHaveTextContent("none");
  });

  it("hands out the provided registry", () => {
    const engine = new EngineRegistry([]);
    let seen: EngineRegistry | undefined;
    const Probe = () => {
      seen = useEngine();
      return null;
    };
    render(
      <EngineContext.Provider value={engine}>
        <Probe />
      </EngineContext.Provider>,
    );
    expect(seen).toBe(engine);
  });

  it("fails loudly without a provider", () => {
    const Probe = () => {
      useEngine();
      return null;
    };
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/EngineContext provider/);
    vi.mocked(console.error).mockRestore();
  });
});
