# Multithreading

Atomify's LAMMPS engine includes the KOKKOS package, which can spread the work over **4 threads**. For large systems this makes a simulation several times faster: about 3× on a 13,500-atom Lennard-Jones melt. For small systems (a few thousand atoms or fewer) the overhead usually makes it slower, so it's off unless you ask for it.

## Turn it on in a script

Add this line near the top of the script, before the styles are defined:

```lammps
suffix kk
```

Many bundled examples do this, for example **Diffusion**, **Large diffusion**, **3D Lennard Jones fluid** and **crack**.

## Turn it on for one run

Click the arrow next to **Save & run simulation**, choose **Sweep variables…**, and switch on **Multithreading** ("Runs LAMMPS with KOKKOS acceleration (×4 threads)"). The switch starts out matching the script: on if it already has `suffix kk`.

Atomify then adds `suffix kk` to the start of the script it gives LAMMPS for this run only. The run's snapshot keeps your original script. The command preview shows the extra `-sf kk -k on t 4` flags.

## When not to use it

- **Small systems.** Threading overhead outweighs the gain.
- **Styles without a KOKKOS version.** Not every pair style, fix or compute has a `/kk` variant. LAMMPS falls back to the regular version for those where it can, and stops with an error where it can't; then turn multithreading off.

Without `suffix kk`, Atomify runs the regular single-threaded styles.

## Safari

Safari can't run the multithreaded engine (see [Browser requirements](/getting-started/requirements)), so Atomify uses a single-threaded build there. The **Multithreading** switch reads "Not available in this browser", and scripts with `suffix kk` run on one thread.

## Related

- [The LAMMPS engine](/reference/lammps-engine)
- [How simulations run](/concepts/how-simulations-run)
