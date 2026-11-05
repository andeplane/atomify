import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ScaleBar from "./ScaleBar";

describe("ScaleBar", () => {
  it("labels a round length with the unit and sizes the bar to it", () => {
    // Arrange: 0.1 Å per pixel fits a 10 Å bar of 100 px
    const getUnitsPerPixel = vi.fn(() => 0.1);

    // Act
    render(<ScaleBar getUnitsPerPixel={getUnitsPerPixel} unit="Å" />);

    // Assert
    expect(screen.getByText("10 Å")).toBeInTheDocument();
    expect(screen.getByTestId("scale-bar-line")).toHaveStyle({
      width: "100px",
    });
  });

  it("shows the bare length when the unit is unknown", () => {
    render(<ScaleBar getUnitsPerPixel={() => 0.1} />);

    expect(screen.getByTestId("scale-bar")).toHaveTextContent(/^10$/);
  });

  it("renders nothing while no scale applies", () => {
    render(<ScaleBar getUnitsPerPixel={() => undefined} unit="Å" />);

    expect(screen.queryByTestId("scale-bar")).not.toBeInTheDocument();
  });

  it("follows zoom changes between frames", async () => {
    // Arrange
    let unitsPerPixel = 0.1;
    render(<ScaleBar getUnitsPerPixel={() => unitsPerPixel} unit="σ" />);
    expect(screen.getByText("10 σ")).toBeInTheDocument();

    // Act: zoom out by 4x
    unitsPerPixel = 0.4;

    // Assert: 48 σ fits in 120 px, so the bar shows 20 σ at 50 px
    await waitFor(() => expect(screen.getByText("20 σ")).toBeInTheDocument());
    expect(screen.getByTestId("scale-bar-line")).toHaveStyle({
      width: "50px",
    });
  });
});
