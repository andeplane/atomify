/** Native LAMMPS output units: https://docs.lammps.org/units.html */
export const UNIT_SYSTEMS = {
  lj: {
    time: "τ",
    length: "σ",
    energy: "ε",
    temperature: "reduced LJ",
    pressure: "ε/σ³",
    velocity: "σ/τ",
  },
  real: {
    time: "fs",
    length: "Å",
    energy: "kcal/mol",
    temperature: "K",
    pressure: "atm",
    velocity: "Å/fs",
  },
  metal: {
    time: "ps",
    length: "Å",
    energy: "eV",
    temperature: "K",
    pressure: "bar",
    velocity: "Å/ps",
  },
  si: {
    time: "s",
    length: "m",
    energy: "J",
    temperature: "K",
    pressure: "Pa",
    velocity: "m/s",
  },
  cgs: {
    time: "s",
    length: "cm",
    energy: "erg",
    temperature: "K",
    pressure: "dyn/cm²",
    velocity: "cm/s",
  },
  electron: {
    time: "fs",
    length: "Bohr",
    energy: "Hartree",
    temperature: "K",
    pressure: "Pa",
    velocity: "Bohr/atomic time unit",
  },
  micro: {
    time: "µs",
    length: "µm",
    energy: "pg·µm²/µs²",
    temperature: "K",
    pressure: "pg/(µm·µs²)",
    velocity: "µm/µs",
  },
  nano: {
    time: "ns",
    length: "nm",
    energy: "ag·nm²/ns²",
    temperature: "K",
    pressure: "ag/(nm·ns²)",
    velocity: "nm/ns",
  },
} as const;
export type UnitStyle = keyof typeof UNIT_SYSTEMS;

export function parseUnitStyle(line: string): UnitStyle | undefined {
  const match = /^\s*Unit style\s*:\s*(\w+)\s*$/.exec(line);
  return match && Object.hasOwn(UNIT_SYSTEMS, match[1])
    ? (match[1] as UnitStyle)
    : undefined;
}

export function modifierAxisLabels(
  category: string,
  style: string,
  xLabel: string,
  yLabel: string,
  units?: UnitStyle,
) {
  const u = units && UNIT_SYSTEMS[units];
  const label = (name: string, unit?: string) =>
    `${name} (${unit ?? "simulation units"})`;
  const x =
    xLabel === "Time"
      ? label("Time", u?.time)
      : category === "compute" && style === "rdf"
        ? label(xLabel, u?.length)
        : xLabel;
  if (category !== "compute")
    return { xLabel: x, yLabel: label(yLabel, "user-defined units") };
  const known: Record<string, [string, string | undefined]> = {
    temp: ["Temperature", u?.temperature],
    pressure: ["Pressure", u?.pressure],
    pe: ["Potential energy", u?.energy],
    ke: ["Kinetic energy", u?.energy],
    msd: ["Mean square displacement", u && `${u.length}²`],
    vacf: ["VACF", u && `(${u.velocity})²`],
    rdf: [yLabel, "dimensionless"],
    gyration: ["Radius of gyration", u?.length],
  };
  const dimension = known[style.replace(/\/kk$/, "")];
  return {
    xLabel: x,
    yLabel: dimension
      ? label(...dimension)
      : label(yLabel, "compute-defined units"),
  };
}
