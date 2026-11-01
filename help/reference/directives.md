# Script directives (#/)

Directives are comment lines in an input script that start with `#/`. LAMMPS ignores them, but Atomify reads them every time the script runs and uses them to set how the system looks.

```lammps
#/camera position 20 20 75
#/camera target 20 20 10
#/atom 1 silicon
#/atom 2 oxygen
#/bond 1 2 2.6
```

They can go anywhere in the script, but only the **input script** is read: directives in files it includes (`include`) are ignored.

## atom

Sets the color and radius of an atom type.

```lammps
#/atom <type> <element>
#/atom <type> <radius> <#RRGGBB>
```

- `<element>` is a lowercase English element name from hydrogen to tungsten, for example `hydrogen`, `carbon`, `oxygen`, `silicon`, `aluminium`, `sulfur`, `iron`. The atom gets that element's color and a radius based on its size. An unknown name is reported in the console (**Atom type 'X' does not exist. Ignoring setting radius and color.**).
- `<radius>` is in the script's length units, and the color is a hex code.

```lammps
#/atom 1 hydrogen
#/atom 2 1.2 #F43F5E
```

## bond

Draws bonds between two atom types when they're closer than a distance.

```lammps
#/bond <type1> <type2> <distance>
```

```lammps
#/bond 1 2 2.6
```

Use one line per pair of types. Bonds defined by the system's topology (molecular atom styles) are always drawn; `#/bond` adds distance-based bonds on top.

## camera

Sets the initial camera.

```lammps
#/camera position <x> <y> <z>
#/camera target <x> <y> <z>
```

`position` is where the camera is and `target` is the point it looks at, in simulation coordinates. The easiest way to get them: set up the view and press <kbd>C</kbd> during a run, which copies both lines ([Move the camera](/guide/camera#save-a-camera-view)).

## Examples in the bundled library

- **Beta-cristobalite**: `#/atom 1 silicon`, `#/atom 2 oxygen`, `#/bond 1 2 2.6`.
- **2D Lennard Jones fluid**: `#/atom 1 1.0 #a1a1a1`, `#/atom 2 3.0 #6EBFC0` and a camera.
- **Ice crystal**: `#/bond 1 2 2.0` draws the O–H bonds.

## Related

- [Atom colors, sizes and bonds](/guide/atom-appearance)
- [Color atoms by a quantity](/guide/color-atoms)
