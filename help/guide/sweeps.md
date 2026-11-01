# Sweep parameters

A **sweep** runs the same script several times with different values of one or more variables, one run per value. The runs queue up, run one after another, and are grouped together in the Runs tab. [Tutorial 4](/tutorials/parameter-sweep) walks through a complete example.

## Make a variable sweepable

Atomify offers a variable as a parameter when the script defines it with a plain number:

```lammps
variable T equal 1.44        # initial temperature
variable rho equal 0.8442
```

- The text after `#` becomes the parameter's label.
- Only `equal`-style variables set to a number count. Variables computed from others (`variable Thalf equal ${T}/2`) follow the values you set.
- If a variable is defined more than once, the first plain-number definition is the parameter.

**How the value is applied.** For each run, Atomify replaces that definition line in the copy of the script LAMMPS runs, so `variable T equal 1.44` becomes `variable T equal 1.5`. Your script file never changes, and later lines that redefine the variable are left as they are. The command preview in the dialog shows the values in LAMMPS's `-var` notation for readability, for example `-var T {1 … 2}` for a sweep.

## Set up a sweep

1. Click the arrow next to **Save & run simulation** and choose **Sweep variables…**.
2. The **New run** dialog lists the script's parameters with their values from the script.

   ![The New run dialog](/screenshots/new-run-modal.webp)

3. To use a different fixed value for this run, type it in.
4. To sweep a parameter, click **Sweep** on its row and enter **from**, **to** and the number of **runs**. The values are spread evenly and include both ends: 1 to 2 in 3 runs gives 1, 1.5 and 2. The default is 3 runs.

   ![Sweeping T](/screenshots/new-run-sweep.webp)

5. Check the summary at the bottom, for example **Creates 3 runs — T = 1, 1.5, 2**.
6. Click **Start 3 runs**.

### Several parameters

Sweeping more than one parameter runs every combination: 3 values of T and 2 of rho make 6 runs. The first parameter in the list changes slowest.

## Watch the queue

![A sweep in progress](/screenshots/runs-tab-sweep-live.webp)

In the Runs tab, a header like **Sweep · T = 1 → 2 · 3 runs** groups the runs. The current run shows its progress; the rest say **queued — starts when the current run finishes**. **Cancel remaining** drops the queued runs and keeps the ones that already ran.

Each run is recorded with its values, and its row shows them (for example **T = 1.5**).

## Check that the value took effect

Add a `print` line after the variable to see the value each run used in its console and log:

```lammps
variable T equal 1.44   # initial temperature
print "T = ${T}"
```

## Compare the runs

The starter notebook's comparison cell plots one thermo quantity for every run, labeled with its parameters. Set `quantity` to any thermo column name, like `"Temp"`, `"PotEng"` or `"Press"`. See [Notebook analysis](/guide/notebook).

## Related

- [Run simulations](/guide/runs)
- [Tutorial 4: Sweep a parameter](/tutorials/parameter-sweep)
