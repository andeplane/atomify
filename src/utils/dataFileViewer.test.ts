import { describe, expect, it } from "vitest";
import { dataFileAtomStyle, dataFileViewerScript } from "./dataFileViewer";

describe("data-file viewing", () => {
  it("detects annotated atom styles and offers a default for older data", () => {
    expect(dataFileAtomStyle("Atoms # full\n\n1 2 3")).toBe("full");
    expect(dataFileAtomStyle("Atoms\n\n1 2 3")).toBe("atomic");
  });
  it("quotes paths, ignores force coefficients and does not integrate dynamics", () => {
    const script = dataFileViewerScript("water sample.data", "full", "real");
    expect(script).toContain('read_data "water sample.data" nocoeff');
    expect(script).toContain("bond_style zero");
    expect(script).toContain("mass * 1.0");
    expect(script).toMatch(/run 0\n$/);
  });
  it("preserves sphere masses and rejects command-expanding filenames", () => {
    expect(dataFileViewerScript("grains.data", "sphere", "si")).not.toContain(
      "mass *",
    );
    expect(() => dataFileViewerScript("a\nclear", "atomic", "lj")).toThrow();
    expect(() => dataFileViewerScript("$name.data", "atomic", "lj")).toThrow();
    expect(() =>
      dataFileViewerScript("a.data", "atomic\nclear", "lj"),
    ).toThrow();
  });
});
