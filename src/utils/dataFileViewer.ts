/** LAMMPS data files often annotate their Atoms section with the atom style. */
export function dataFileAtomStyle(content: string): string {
  return (
    content.match(
      /^[ \t]*Atoms[ \t]*#[ \t]*([\w/]+(?:[ \t]+[\w/]+)*)[ \t]*$/m,
    )?.[1] ?? "atomic"
  );
}

/** Read coordinates/topology without requiring the original force field. */
export function dataFileViewerScript(
  path: string,
  atomStyle: string,
  units: string,
): string {
  if (/[\r\n"'$]/.test(path))
    throw new Error(
      "Rename the data file to remove quotes, dollar signs, or line breaks before viewing it.",
    );
  if (!/^[\w/]+(?:[ \t]+[\w/]+)*$/.test(atomStyle))
    throw new Error("Enter a valid LAMMPS atom style.");
  if (!/^(lj|real|metal|si|cgs|electron|micro|nano)$/.test(units))
    throw new Error("Choose a LAMMPS unit system.");
  // Zero styles let LAMMPS initialize topology without simulating a force field.
  const molecular = /\b(full|molecular|bond|angle|template)\b/.test(atomStyle);
  const perAtomMass = /\b(sphere|ellipsoid|peri|line|tri|body)\b/.test(
    atomStyle,
  );
  return [
    "# View structure only: no timesteps are integrated.",
    `units ${units}`,
    `atom_style ${atomStyle}`,
    "pair_style zero 1.0",
    ...(molecular
      ? [
          "bond_style zero",
          "angle_style zero",
          "dihedral_style zero",
          "improper_style zero",
        ]
      : []),
    `read_data "${path}" nocoeff`,
    ...(!perAtomMass ? ["mass * 1.0"] : []),
    "pair_coeff * *",
    ...(molecular
      ? [
          'if "$(extract_setting(nbondtypes)) > 0" then "bond_coeff *"',
          'if "$(extract_setting(nangletypes)) > 0" then "angle_coeff *"',
          'if "$(extract_setting(ndihedraltypes)) > 0" then "dihedral_coeff *"',
          'if "$(extract_setting(nimpropertypes)) > 0" then "improper_coeff *"',
        ]
      : []),
    "run 0",
    "",
  ].join("\n");
}
