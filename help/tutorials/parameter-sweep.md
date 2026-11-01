# Tutorial 4: Sweep a parameter

**Time:** 20 minutes. **You need:** the **LJ melt** project from [Tutorial 2](/tutorials/write-a-script).

How does the starting temperature change what happens to the crystal? Instead of editing the script and running it three times by hand, you will mark the temperature as a parameter, run it at three values in one go, and compare the runs in the notebook.

## 1. A script with a parameter

In **LJ melt**, create `in.sweep` (Files → **New file**), paste this script and make it the input script (the target icon on its row, **Set as input script**):

<<< @/snippets/in.sweep{lammps}

Atomify treats a variable as a **parameter** you can change per run when it is defined with a plain number:

```lammps
variable T equal 1.44   # initial temperature
```

The comment after the number becomes the parameter's label in the run dialog. Variables computed from others, like `variable Thalf equal ${T}/2`, aren't parameters themselves; they follow the values you set.

The `print` line writes the value LAMMPS actually used to the log, so you can check each run.

## 2. Set up the sweep

Click the arrow next to **Save & run simulation** to open **Run options**, and choose **Sweep variables…**.

![Run options](/screenshots/run-menu.webp)

The **New run** dialog lists the script's parameters. **T** shows its label, _initial temperature_, and its value from the script, 1.44.

![The New run dialog](/screenshots/new-run-modal.webp)

Click **Sweep** on the T row. Set it to go from **1** to **2** in **3** runs. The values are spread evenly and include both ends: 1, 1.5 and 2. The summary at the bottom reads **Creates 3 runs — T = 1, 1.5, 2**, and the command preview sums it up as `-var T {1 … 2}`.

![A sweep of T over three values](/screenshots/new-run-sweep.webp)

The script file itself never changes: for each run, Atomify rewrites the `variable T equal …` line in the copy of the script LAMMPS runs.

::: tip Several parameters
If you sweep two parameters, Atomify runs every combination. Sweeping T over 3 values and a density over 2 values creates 6 runs. The first parameter changes slowest.
:::

Click **Start 3 runs**.

## 3. Watch the queue

Atomify runs one simulation at a time. It opens the first run; click **Runs** at the top left to go back to the list.

![A sweep in progress](/screenshots/runs-tab-sweep-live.webp)

The three runs are grouped under a sweep header, **Sweep · T = 1 → 2 · 3 runs**. The current run shows its progress; the others say **queued — starts when the current run finishes**. **Cancel remaining** would drop the queued runs and keep the ones that already ran.

## 4. Check the values

When the runs are done, open each one and expand its console. You should see **Sweep check: T = 1**, **T = 1.5** and **T = 2**. Each run row also shows its value, like **T = 1.5**.

## 5. Compare the runs in the notebook

Open the **Notebook** tab. The starter notebook's third code cell lists every run with its status and parameters, and the next cell compares a quantity across runs:

```python
quantity = "Temp"  # any column from log.keywords
```

Run all cells (**Run → Run All Cells**). The comparison plot has one curve per run, labeled with its value of T. Change `quantity` to `"PotEng"` or `"Press"` and run the cell again.

Notice that the runs end at different temperatures than they started: as the crystal melts, kinetic energy turns into potential energy. That is a nice thing to explore with a finer sweep.

## What you learned

- A `variable NAME equal <number>` line is a parameter; a comment after it is its label.
- **Sweep variables…** creates one run per value (or per combination) and queues them.
- Each run's parameters are recorded with it, and the notebook can group and label runs by them.

**Next:** [Tutorial 5: Make a great-looking view](/tutorials/visualize-a-system), or read the [sweeps guide](/guide/sweeps).
