import { describe, expect, it } from "vitest";
import {
  modifierAxisLabels as labels,
  parseUnitStyle,
  UNIT_SYSTEMS,
} from "./units";

describe("LAMMPS axis units", () => {
  it("recognizes runtime setup output without interpreting script text", () => {
    expect(parseUnitStyle("  Unit style    : metal")).toBe("metal");
    expect(parseUnitStyle("units real")).toBeUndefined();
    expect(parseUnitStyle("Unit style : unknown")).toBeUndefined();
  });
  it("distinguishes pressure and time in real, metal, and reduced units", () => {
    expect(labels("compute", "pressure", "Time", "Pressure", "real")).toEqual({
      xLabel: "Time (fs)",
      yLabel: "Pressure (atm)",
    });
    expect(labels("compute", "pressure", "Time", "Pressure", "metal")).toEqual({
      xLabel: "Time (ps)",
      yLabel: "Pressure (bar)",
    });
    expect(labels("compute", "temp", "Time", "Value", "lj").yLabel).toBe(
      "Temperature (reduced LJ)",
    );
  });
  it("uses distance for RDF and squared dimensions for correlation plots", () => {
    expect(labels("compute", "rdf", "r", "RDF", "si")).toEqual({
      xLabel: "r (m)",
      yLabel: "RDF (dimensionless)",
    });
    expect(labels("compute", "msd", "Time", "MSD", "nano").yLabel).toBe(
      "Mean square displacement (nm²)",
    );
    expect(labels("compute", "vacf", "Time", "VACF", "electron").yLabel).toBe(
      "VACF ((Bohr/atomic time unit)²)",
    );
  });
  it("does not invent dimensions for user expressions or unavailable metadata", () => {
    expect(
      labels("variable", "equal", "Time", "Value", "real").yLabel,
    ).toContain("user-defined units");
    expect(
      labels("compute", "custom", "Time", "Value", "real").yLabel,
    ).toContain("compute-defined units");
    expect(labels("compute", "temp", "Time", "Value").yLabel).toBe(
      "Temperature (simulation units)",
    );
    expect(Object.keys(UNIT_SYSTEMS)).toHaveLength(8);
  });
});
