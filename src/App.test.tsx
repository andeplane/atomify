import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// App is a pure switch between the two shells; mock both so the test pins
// the routing decision without dragging in the store or the engine.
vi.mock(import("./shell/Shell"), () => ({
  default: () => <div data-testid="new-shell" />,
}));
vi.mock(import("./EmbeddedApp"), () => ({
  default: () => <div data-testid="embedded-app" />,
}));
// isEmbeddedMode reads window.location at call time; mock for per-test control.
vi.mock(import("./utils/embeddedMode"), () => ({
  isEmbeddedMode: vi.fn(() => false),
}));

import App from "./App";
import { isEmbeddedMode } from "./utils/embeddedMode";

describe("App", () => {
  beforeEach(() => {
    vi.mocked(isEmbeddedMode).mockReset();
  });

  it("renders the new projects shell outside embedded mode", () => {
    vi.mocked(isEmbeddedMode).mockReturnValue(false);

    render(<App />);

    expect(screen.getByTestId("new-shell")).toBeInTheDocument();
    expect(screen.queryByTestId("embedded-app")).not.toBeInTheDocument();
  });

  it("renders the legacy shell in embedded mode", () => {
    vi.mocked(isEmbeddedMode).mockReturnValue(true);

    render(<App />);

    expect(screen.getByTestId("embedded-app")).toBeInTheDocument();
    expect(screen.queryByTestId("new-shell")).not.toBeInTheDocument();
  });
});
