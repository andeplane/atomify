/** Longest the scale bar may be drawn, in CSS pixels. */
export const SCALE_BAR_MAX_WIDTH_PX = 120;

/**
 * World length covered by one CSS pixel of an orthographic camera's
 * viewport. The frustum height (top - bottom) spans the viewport height and
 * zooming in divides it by the camera's zoom.
 */
export function orthographicUnitsPerPixel(
  camera: { top: number; bottom: number; zoom: number },
  viewportHeightPx: number,
): number | undefined {
  const unitsPerPixel =
    (camera.top - camera.bottom) / camera.zoom / viewportHeightPx;
  return Number.isFinite(unitsPerPixel) && unitsPerPixel > 0
    ? unitsPerPixel
    : undefined;
}

/** The largest 1, 2 or 5 times a power of ten that is at most maxLength. */
export function niceLength(maxLength: number): number {
  let decade = 10 ** Math.floor(Math.log10(maxLength));
  // Math.log10 can land just beside an exact power of ten.
  if (decade > maxLength) decade /= 10;
  if (decade * 10 <= maxLength) decade *= 10;
  const step = [5, 2, 1].find((s) => s * decade <= maxLength) ?? 1;
  // Strip floating point noise such as 0.30000000000000004.
  return Number((step * decade).toPrecision(1));
}

/** A round bar length and its on-screen width for the current zoom. */
export function scaleBarSize(
  unitsPerPixel: number,
  maxWidthPx = SCALE_BAR_MAX_WIDTH_PX,
): { length: number; widthPx: number } {
  const length = niceLength(unitsPerPixel * maxWidthPx);
  return { length, widthPx: length / unitsPerPixel };
}
