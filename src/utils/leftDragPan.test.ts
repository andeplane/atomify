import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { remapLeftDragToPan } from "./leftDragPan";

describe("remapLeftDragToPan", () => {
  let container: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let overlay: HTMLDivElement;
  let received: MouseEvent[];

  beforeEach(() => {
    container = document.createElement("div");
    canvas = document.createElement("canvas");
    overlay = document.createElement("div");
    container.append(canvas, overlay);
    document.body.append(container);
    received = [];
    // Stands in for omovi's ComboControls and picking handler
    canvas.addEventListener("mousedown", (ev) => received.push(ev));
  });

  afterEach(() => {
    container.remove();
  });

  it("re-dispatches left-button mousedowns on the canvas as right-button", () => {
    // Arrange
    remapLeftDragToPan(container, canvas);
    const bubbled = vi.fn();
    window.addEventListener("mousedown", bubbled);

    // Act
    canvas.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        button: 0,
        buttons: 1,
        clientX: 12,
        clientY: 34,
        shiftKey: true,
      }),
    );
    window.removeEventListener("mousedown", bubbled);

    // Assert
    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      button: 2,
      buttons: 2,
      clientX: 12,
      clientY: 34,
      shiftKey: true,
    });
    expect(bubbled).toHaveBeenCalledTimes(1);
  });

  it("leaves right-button mousedowns and other targets untouched", () => {
    remapLeftDragToPan(container, canvas);
    const right = new MouseEvent("mousedown", { bubbles: true, button: 2 });
    canvas.dispatchEvent(right);
    const overlayDown = vi.fn();
    overlay.addEventListener("mousedown", overlayDown);
    overlay.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, button: 0 }),
    );

    expect(received).toEqual([right]);
    expect(overlayDown).toHaveBeenCalledTimes(1);
  });

  it("shows a move cursor and restores rotate behaviour on cleanup", () => {
    canvas.style.cursor = "crosshair";
    const cleanup = remapLeftDragToPan(container, canvas);
    expect(canvas.style.cursor).toBe("move");

    cleanup();
    canvas.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, button: 0 }),
    );

    expect(canvas.style.cursor).toBe("crosshair");
    expect(received).toHaveLength(1);
    expect(received[0].button).toBe(0);
  });
});
