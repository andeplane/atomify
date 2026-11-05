# Select atoms and measure

Click atoms in the 3D view to see where they are and to measure distances and angles between them.

![Two selected atoms and their distance](/screenshots/selection.webp)

## Select

- **Click** an atom to select it; click it again to deselect it.
- **Shift-click** to add atoms to the selection or remove them.
- **Esc** clears the selection.

The **Selected Atoms** panel shows each selected atom's id and position (for the first three; then how many more are selected).

## Measure

- **Two atoms:** the distance between them.
- **Three atoms:** the three distances and the three angles of the triangle they form.

Click any distance or angle to **plot it over time** while the run goes on, with **Export CSV**. Distances are in the simulation's length unit, angles in degrees.

## Tips

- Pause with <kbd>Space</kbd> to make clicking a fast-moving atom easier.
- A [slice](/guide/slice) helps you reach atoms inside the system.
