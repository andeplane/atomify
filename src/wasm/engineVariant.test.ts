import { describe, expect, it } from "vitest";
import { pickEngineVariant } from "./engineVariant";

describe("pickEngineVariant", () => {
  it("picks the threaded build in a cross-origin isolated context", () => {
    expect(
      pickEngineVariant({
        crossOriginIsolated: true,
        SharedArrayBuffer,
      }),
    ).toBe("threaded");
  });

  it("falls back to the serial build without isolation (Safari)", () => {
    expect(
      pickEngineVariant({ crossOriginIsolated: false, SharedArrayBuffer }),
    ).toBe("serial");
    expect(pickEngineVariant({ crossOriginIsolated: true })).toBe("serial");
    expect(pickEngineVariant({})).toBe("serial");
  });
});
