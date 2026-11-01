# Color atoms by a quantity

**Color atoms**, in the run header, opens **Particle color settings**. It colors atoms by their type, by a per-atom compute or by group membership. It works on live runs and structure views.

![The color settings](/screenshots/color-settings.webp)

## Color by a compute

1. Your script needs a **per-atom** compute, for example:

   ```lammps
   compute ke all ke/atom
   ```

   Other useful ones: `pe/atom`, `cna/atom`, `cluster/atom`, `coord/atom`, `centro/atom`, `stress/atom` (with an index), `property/atom`.

2. Run the script and click **Color atoms**.
3. In **Color by**, choose the compute under **Computes**.
4. Pick a **Colormap**: Jet (the default), Viridis, Magma, Plasma, Inferno, Cool, Hot, Hsv, Rainbow, Portland, Warm, Coolwarm, Seismic or Rdbu.

![Atoms colored by kinetic energy](/screenshots/colored-by-ke.webp)

Only per-atom computes are offered. Global computes (like `temp`), fixes and variables can't color atoms.

## Value range

By default the colormap spans the lowest and highest value present, shown under **Value Range** as **Global: [min, max]**. A few extreme atoms can wash out everything else, so check **Use custom range** and enter a **Minimum value** and **Maximum value**. **Reset global min/max** forgets the extremes seen so far.

## Color by group

In **Color by**, choose a group under **Groups**. Members are colored as 1 and other atoms as 0, so the group stands out.

![Colored by group](/screenshots/color-by-group.webp)

## The legend

While atoms are colored by a quantity, a legend in the bottom-left corner of the view shows its name, the colormap, and the minimum and maximum. Its gear icon reopens the settings.

## Go back to type colors

Choose **Particle type** in **Color by**.

::: info Resets every run
The color setting resets at the start of each run. To set atom type colors permanently, use [`#/atom` directives](/guide/atom-appearance).
:::

## Related

- [Tutorial 5: Make a great-looking view](/tutorials/visualize-a-system)
- [Tracked computes, fixes and variables](/reference/tracked-quantities)
