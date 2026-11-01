# Units on plot axes

Atomify labels live plots with units based on the script's `units` command, which it reads from LAMMPS's output.

| `units`    | Time | Length | Energy     | Temperature | Pressure    |
| ---------- | ---- | ------ | ---------- | ----------- | ----------- |
| `lj`       | τ    | σ      | ε          | reduced LJ  | ε/σ³        |
| `real`     | fs   | Å      | kcal/mol   | K           | atm         |
| `metal`    | ps   | Å      | eV         | K           | bar         |
| `si`       | s    | m      | J          | K           | Pa          |
| `cgs`      | s    | cm     | erg        | K           | dyn/cm²     |
| `electron` | fs   | Bohr   | Hartree    | K           | Pa          |
| `micro`    | µs   | µm     | pg·µm²/µs² | K           | pg/(µm·µs²) |
| `nano`     | ns   | nm     | ag·nm²/ns² | K           | ag/(nm·ns²) |

## How axes are labeled

- The x axis is **Time** in the time unit, or for `rdf` the distance in the length unit.
- Known computes get a name and unit: `temp` → **Temperature**, `pressure` → **Pressure**, `pe` → **Potential energy**, `ke` → **Kinetic energy**, `msd` → **Mean square displacement** (length²), `vacf` → **VACF** (velocity²), `gyration` → **Radius of gyration** (length), `rdf` → dimensionless.
- Other computes are labeled _(compute-defined units)_, and fixes and variables _(user-defined units)_, because their units depend on what you computed.
- Before the units are known, axes say _(simulation units)_.

The scale bar in [orthographic view](/guide/rendering) uses the length unit too.
