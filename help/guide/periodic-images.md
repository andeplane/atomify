# Periodic images

With periodic boundaries, the simulation box repeats in every direction. **Images** draws copies of the box next to it, so you can see the periodic structure, for example a crystal or a membrane that continues across the boundary.

![Periodic images](/screenshots/periodic-images.webp)

1. Click **Images 1×1×1** in the run header.
2. Set **Images along x**, **y** and **z**, from 1 to 10 each.

The button shows the current setting, for example **Images 2×2×2**. Set all three back to 1 to turn it off.

Things to know:

- The copies are shifted by the box vectors and only drawn. **Display only**: they don't change the simulation or the atom count.
- Triclinic (tilted) boxes are supported.
- At most 500,000 atoms are drawn. If your settings would draw more, Atomify says so and draws fewer copies.
- The setting stays for the rest of your browser session, across runs.
- Works with [Slice](/guide/slice) and [Color atoms](/guide/color-atoms).
