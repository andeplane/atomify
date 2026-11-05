/**
 * Make left-drag pan the omovi camera instead of rotating it.
 *
 * omovi's ComboControls hardcode the left button to rotate and the right
 * button to pan, and expose no way to remap them. While installed, a
 * left-button mousedown on the canvas is stopped in the capture phase on its
 * container (so neither the controls nor anything else sees it) and
 * re-dispatched on the canvas as a right-button mousedown. The controls track
 * the drag from window mousemove/mouseup and only read coordinates, and the
 * particle picker records the same position and Shift state, so clicks and
 * Shift+click selection keep working.
 *
 * Returns a cleanup function that removes the remapping.
 */
export function remapLeftDragToPan(
  container: HTMLElement,
  canvas: HTMLElement,
): () => void {
  const onMouseDown = (ev: MouseEvent) => {
    if (ev.target !== canvas || ev.button !== 0) return;
    ev.stopPropagation();
    canvas.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: ev.view,
        detail: ev.detail,
        screenX: ev.screenX,
        screenY: ev.screenY,
        clientX: ev.clientX,
        clientY: ev.clientY,
        ctrlKey: ev.ctrlKey,
        shiftKey: ev.shiftKey,
        altKey: ev.altKey,
        metaKey: ev.metaKey,
        button: 2,
        buttons: 2,
      }),
    );
  };
  const previousCursor = canvas.style.cursor;
  canvas.style.cursor = "move";
  container.addEventListener("mousedown", onMouseDown, true);
  return () => {
    container.removeEventListener("mousedown", onMouseDown, true);
    canvas.style.cursor = previousCursor;
  };
}
