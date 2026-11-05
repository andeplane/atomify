# Rendering and lighting

Open **Settings** (bottom of the sidebar) → **Rendering**. These settings apply to every run and are saved in your browser.

![Rendering settings](/screenshots/settings-rendering.webp)

| Setting                                  | Default  | What it does                                                                                 |
| ---------------------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| **Ambient occlusion (SSAO)**             | On       | Soft shadows where atoms are close together, which makes 3D structure much easier to read.   |
| **Occlusion quality**                    | Detailed | **Detailed — smoother shadows**, or **Faster — fewer samples**, which is lighter on the GPU. |
| **Show simulation box**                  | On       | Draws the edges of the simulation box.                                                       |
| **Show walls**                           | On       | Draws walls from `fix wall/*` commands that use fixed positions (`EDGE` or a number).        |
| **Orthographic camera**                  | Off      | Removes perspective: parallel lines stay parallel and sizes don't depend on distance.        |
| **Show scale bar (orthographic camera)** | Off      | A length scale in the bottom-right corner. Only with the orthographic camera.                |
| **Ambient light intensity**              | 0.05     | Uniform light from all directions (0 to 1).                                                  |
| **Point light intensity**                | 20       | The light at the camera (0 to 40).                                                           |

![An orthographic view with a scale bar](/screenshots/ortho-scale-bar.webp)

## Tips

- On a slow computer, turn ambient occlusion off or use **Faster**.
- For pictures, keep **Detailed**, raise the point light a little, and use [full screen](/guide/watch-a-run#full-screen).
- The scale bar's unit follows the script's `units` command, for example Å for `real` and `metal`, σ for `lj`.

## Theme

**Settings → General** switches between the dark and light theme; so does the switch at the bottom of the sidebar. See the [settings reference](/reference/settings).
