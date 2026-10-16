import { describe, expect, it } from "vitest";
import {
  niceLength,
  orthographicUnitsPerPixel,
  scaleBarSize,
} from "./scaleBar";

describe("orthographicUnitsPerPixel", () => {
  it("spreads the frustum height over the viewport height", () => {
    expect(
      orthographicUnitsPerPixel({ top: 10, bottom: -10, zoom: 1 }, 400),
    ).toBe(0.05);
  });

  it("shrinks with camera zoom", () => {
    expect(
      orthographicUnitsPerPixel({ top: 10, bottom: -10, zoom: 4 }, 400),
    ).toBe(0.0125);
  });

  it("is undefined for an empty or collapsed viewport", () => {
    expect(
      orthographicUnitsPerPixel({ top: 10, bottom: -10, zoom: 1 }, 0),
    ).toBeUndefined();
    expect(
      orthographicUnitsPerPixel({ top: 0, bottom: 0, zoom: 1 }, 400),
    ).toBeUndefined();
  });
});

describe("niceLength", () => {
  it.each([
    [1, 1],
    [1.9, 1],
    [2, 2],
    [4.99, 2],
    [5, 5],
    [9.99, 5],
    [10, 10],
    [12, 10],
    [37, 20],
    [1000, 1000],
    [0.3, 0.2],
    [0.001, 0.001],
    [0.0007, 0.0005],
    [7e-9, 5e-9],
  ])("rounds %f down to %f", (maxLength, expected) => {
    expect(niceLength(maxLength)).toBe(expected);
  });
});

describe("scaleBarSize", () => {
  it("picks a round length that fits and sizes the bar to match", () => {
    // 0.1 Å per pixel allows at most 12 Å in 120 px.
    expect(scaleBarSize(0.1)).toEqual({ length: 10, widthPx: 100 });
  });

  it("keeps the bar between 40% and 100% of the maximum width", () => {
    for (const unitsPerPixel of [0.0013, 0.042, 0.37, 2.9, 61, 840]) {
      const { widthPx } = scaleBarSize(unitsPerPixel, 120);
      expect(widthPx).toBeGreaterThanOrEqual(48);
      expect(widthPx).toBeLessThanOrEqual(120 + 1e-9);
    }
  });
});
