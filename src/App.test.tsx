import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// The shell drags in the store and the engine; mock it so the test pins
// App's (now trivial) routing: the projects shell always renders.
vi.mock(import("./shell/Shell"), () => ({
  default: () => <div data-testid="new-shell" />,
}));

import App from "./App";

describe("App", () => {
  it("always renders the projects shell", () => {
    render(<App />);

    expect(screen.getByTestId("new-shell")).toBeInTheDocument();
  });

  it("renders the shell even for legacy share/embed URLs", () => {
    // Embedded mode and URL-encoded share links were removed (2026-07-11);
    // old ?data=/?embed=true URLs land on the projects shell.
    window.history.replaceState(null, "", "/?data=abc123&embed=true");

    render(<App />);

    expect(screen.getByTestId("new-shell")).toBeInTheDocument();

    window.history.replaceState(null, "", "/");
  });
});
