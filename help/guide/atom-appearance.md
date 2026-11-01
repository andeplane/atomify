# Atom colors, sizes and bonds

Atomify draws each atom type with a default color and size. To choose your own, add **directives** to the input script: comment lines that start with `#/`. LAMMPS ignores them as comments; Atomify reads them every time the script runs.

## By chemical element

```lammps
#/atom 1 silicon
#/atom 2 oxygen
```

This gives type 1 the radius and color of silicon and type 2 those of oxygen. Use the lowercase English element name, from `hydrogen` up to `tungsten` (for example `carbon`, `nitrogen`, `aluminium`, `sulfur`, `iron`). An unknown name is reported in the console and ignored.

## Any radius and color

```lammps
#/atom 1 0.6 #3F6EFF
#/atom 2 1.2 #F43F5E
```

The radius is in the simulation's length units; the color is a hex code `#RRGGBB`.

## Bonds by distance

```lammps
#/bond 1 2 2.6
```

Draws a bond between every type 1 and type 2 atom closer than 2.6 length units. Add one line per pair of types. Bonds that the system itself defines (with `atom_style bond`, `molecular` or `full`) are drawn automatically.

## A complete example

The bundled **Beta-cristobalite** example starts with:

```lammps
#/atom 1 silicon
#/atom 2 oxygen
#/bond 1 2 2.6
```

## Rules

- Directives are read from the **input script only**, not from files it includes.
- They are re-read every run, so edit and run again to see a change.
- Atoms defined with `atom_style sphere` use their own diameters.
- To color atoms by a computed quantity instead of by type, use [Color atoms](/guide/color-atoms).

See the full list, including camera directives, in the [directives reference](/reference/directives).
