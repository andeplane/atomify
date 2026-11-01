# Slice

**Slice** shows only the atoms within a slab, so you can see inside a system: a grain boundary, a pore, the core of a nanoparticle.

![A slice through the system](/screenshots/slice.webp)

1. Click **Slice** in the run header and turn on **Show only a slab**. The button now reads **Slice on**.
2. Choose the **Normal**, the direction the slab is perpendicular to: **x**, **y**, **z** (the default), or **custom** to type a direction vector (default 1, 1, 1).
3. Drag **Position** to move the slab through the box, and **Width** to set its thickness. The slab starts in the middle of the box, one fifth of the box wide.
4. **Invert (hide the slab)** does the opposite: it hides the slab and shows everything else, which cuts a gap through the system.

Turn **Show only a slab** off to see all atoms again. Slicing only affects the drawing; the simulation is unchanged. It works on live runs and structure views, together with [periodic images](/guide/periodic-images) and [colors](/guide/color-atoms).

::: info Resets every run
The slice turns off at the start of each run.
:::
