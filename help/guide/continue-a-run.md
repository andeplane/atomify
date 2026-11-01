# Continue a simulation

When a run completes, its atoms are still loaded in the engine. **Continue simulation** advances them further, as if the script had one more `run` command, and saves the result as a new run.

## Continue a run

1. Open the completed run.
2. Click **Continue simulation** in the run header.
3. Enter the number of **Additional timesteps** (default 1000).
4. Click **Continue**.

![The Continue simulation dialog](/screenshots/continue-modal.webp)

The new run starts from the last step of the old one. Its header says **Continued from #NNN**.

## When you can continue

**Continue simulation** is available only when:

- the run **completed** (not failed, canceled or still running),
- it's the run the engine currently holds in memory, meaning you haven't run anything else or reloaded the page since, and
- nothing else is running or queued.

If the run is no longer loaded, Atomify says **This run is no longer loaded in the engine. Run it again before continuing.**

## What's recorded

The continued run gets a script `in.continue-<run>` that is the original script followed by `run N`. Its snapshot therefore describes exactly how to reproduce it from scratch.

## After a reload: Run full sequence again

A continued run shows **Run full sequence again**. It replays the whole chain from the beginning, the original script and then each continuation, as a new run. Use it to get back to the same state after a reload.

## Related

- [Run simulations](/guide/runs)
- [How simulations run](/concepts/how-simulations-run)
