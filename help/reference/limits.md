# Limits

| What                                 | Limit                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| Engine memory                        | 4 GB                                                                                 |
| Threads (with `suffix kk`)           | 4                                                                                    |
| Simulations at a time                | 1 (others wait in the queue)                                                         |
| Simulation speed                     | 1 to 200 timesteps per screen update                                                 |
| Live console                         | Last 2000 lines (`log.lammps` has everything)                                        |
| Output files copied during a run     | Up to 4 MB each, every few seconds; all files at the end                             |
| Input files in a run's snapshot      | Up to 64 MB each; larger files are recorded but not copied                           |
| Files copied into a run              | Top-level files only, not subfolders                                                 |
| Periodic images                      | 1 to 10 per direction; at most 500,000 atoms drawn                                   |
| Continue simulation                  | 1 to 2,147,483,647 additional timesteps                                              |
| Sweep values per parameter (default) | 3                                                                                    |
| Autosave delay                       | Half a second after you stop typing                                                  |
| Recent projects on Home              | 8                                                                                    |
| Examples on Home                     | 4                                                                                    |
| Browser storage                      | Set by your browser, usually a share of free disk space. See **Settings → Storage**. |

See also [Known limitations](/faq/known-limitations).
