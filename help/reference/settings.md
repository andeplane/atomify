# Settings

Open **Settings** at the bottom of the sidebar. All settings are saved in your browser.

## General

![General settings](/screenshots/settings-general.webp)

| Setting   | Options     | Default | Notes                                                                           |
| --------- | ----------- | ------- | ------------------------------------------------------------------------------- |
| **Theme** | Dark, Light | Dark    | Also switchable at the bottom of the sidebar. The notebook keeps its own theme. |

Files autosave as you type, so there is no save setting.

![Atomify in the light theme](/screenshots/home-light.webp)

## Rendering

![Rendering settings](/screenshots/settings-rendering.webp)

| Setting                                  | Default  | Notes                                                              |
| ---------------------------------------- | -------- | ------------------------------------------------------------------ |
| **Ambient occlusion (SSAO)**             | On       | Soft contact shadows.                                              |
| **Occlusion quality**                    | Detailed | **Detailed — smoother shadows** or **Faster — fewer samples**.     |
| **Show simulation box**                  | On       |                                                                    |
| **Show walls**                           | On       | Walls from `fix wall/*` with fixed positions (`EDGE` or a number). |
| **Orthographic camera**                  | Off      | No perspective.                                                    |
| **Show scale bar (orthographic camera)** | Off      | Bottom-right corner. Needs the orthographic camera.                |
| **Ambient light intensity**              | 0.05     | 0 to 1.                                                            |
| **Point light intensity**                | 20       | 0 to 40.                                                           |

See [Rendering and lighting](/guide/rendering).

## Storage

![Storage settings](/screenshots/settings-storage.webp)

| Item                      | What it shows or does                                                              |
| ------------------------- | ---------------------------------------------------------------------------------- |
| **Browser storage used**  | Space used by this site, out of roughly how much the browser allows.               |
| **Protect from eviction** | Asks the browser to never clear this site's storage. Can't be undone from Atomify. |
| **Per project**           | Each project's runs and size, with a button to delete it.                          |

See [Manage browser storage](/guide/storage).

## Other things Atomify remembers

| What                          | Where              |
| ----------------------------- | ------------------ |
| Sidebar collapsed or expanded | This browser       |
| The last project you opened   | This browser       |
| Console expanded or collapsed | This browser tab   |
| Simulation speed              | This browser tab   |
| Periodic images               | This browser tab   |
| Color atoms and slice         | Reset at every run |
