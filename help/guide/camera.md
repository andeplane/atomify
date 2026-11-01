# Move the camera

## Mouse and trackpad

| Action                     | Mouse                             |
| -------------------------- | --------------------------------- |
| Rotate                     | Drag with the left button         |
| Pan                        | Drag with the right button        |
| Zoom (towards the pointer) | Scroll wheel or two-finger scroll |

**Pan mode.** On a trackpad or where right-drag is awkward, press <kbd>P</kbd>. Left-drag now pans, and the view shows **Pan mode · press P to rotate**. Press <kbd>P</kbd> again to go back to rotating.

![Pan mode](/screenshots/pan-mode.webp)

## Touch

One finger rotates; two fingers pinch to zoom and move to pan.

## Keyboard

Click the 3D view first so it has keyboard focus.

| Key                                                 | Action              |
| --------------------------------------------------- | ------------------- |
| <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> | Turn the camera     |
| <kbd>W</kbd> / <kbd>S</kbd>                         | Move forward / back |
| <kbd>A</kbd> / <kbd>D</kbd>                         | Move left / right   |
| <kbd>E</kbd> / <kbd>Q</kbd>                         | Move up / down      |
| <kbd>Shift</kbd> + any of these                     | Three times faster  |

## Save a camera view

1. Set up the view you want.
2. Click the 3D view and press <kbd>C</kbd>. Atomify copies two lines to the clipboard:

   ```lammps
   #/camera position 24.1 18.3 30.6
   #/camera target 5.0 5.0 5.0
   ```

3. Paste them into your input script, anywhere. Every run of the script now starts from this view.

See [Script directives](/reference/directives#camera).

## Orthographic view

To view without perspective, for example to compare lattice planes, turn on **Orthographic camera** in [Settings → Rendering](/guide/rendering). You can then also show a scale bar.

## Virtual reality

If your browser and headset support WebXR, a VR button appears in the 3D view.

## Related

- [Keyboard and mouse reference](/reference/keyboard-shortcuts)
