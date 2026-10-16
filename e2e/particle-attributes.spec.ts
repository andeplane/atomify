import { expect, test } from "@playwright/test";
import { createBlankProject, gotoApp, waitForEngine } from "./helpers";

test("instance radius controls both drawing and off-center GPU picking", async ({
  page,
}) => {
  await gotoApp(page);
  await createBlankProject(page, "Particle attributes", "particle-attributes");
  await page.getByTestId("upload-input").setInputFiles([
    {
      name: "one.data",
      mimeType: "text/plain",
      buffer: Buffer.from(
        "Sparse atom\n\n1 atoms\n1 atom types\n\n0 8 xlo xhi\n0 8 ylo yhi\n0 8 zlo zhi\n\nAtoms # atomic\n\n42 1 4 4 4\n",
      ),
    },
    {
      name: "in.attrs",
      mimeType: "text/plain",
      buffer: Buffer.from(
        "units lj\natom_style atomic\nread_data one.data\nmass * 1\npair_style zero 1\npair_coeff * *\nrun 100000\n",
      ),
    },
  ]);
  await waitForEngine(page);
  await page.getByTestId("run-file-in.attrs").click();
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const path = "/atomify/src/store/index.ts";
          const s = (await import(path)).default.getState();
          return (
            s.render.particles?.geometry?.getAttribute("atomRadius")?.count ?? 0
          );
        }),
      { timeout: 60_000 },
    )
    .toBe(1);
  const point = await page.evaluate(async () => {
    const path = "/atomify/src/store/index.ts";
    const threePath = "/atomify/node_modules/three/build/three.module.js";
    const store = (await import(path)).default;
    const THREE = await import(threePath);
    store.getActions().simulation.setPaused(true);
    const s = store.getState(),
      v = s.render.visualizer,
      p = s.render.particles;
    v.setRadius(42, 1.23456);
    v.setColor(42, { r: 255, g: 0, b: 0 });
    const radius = p.geometry.getAttribute("atomRadius").getX(0);
    const color = Array.from(p.geometry.getAttribute("atomColor").array);
    const center = new THREE.Vector3(4, 4, 4).applyMatrix4(p.mesh.matrixWorld);
    const right = new THREE.Vector3().setFromMatrixColumn(
      v.camera.matrixWorld,
      0,
    );
    const target = center.addScaledVector(right, 0.8).project(v.camera);
    const rect = v.canvas.getBoundingClientRect();
    return {
      radius,
      color,
      x: rect.left + ((target.x + 1) * rect.width) / 2,
      y: rect.top + ((1 - target.y) * rect.height) / 2,
    };
  });
  expect(point.radius).toBeCloseTo(1.23456, 6);
  expect(point.color).toEqual([1, 0, 0]);
  const png = await page
    .getByTestId("run-detail")
    .locator("canvas")
    .first()
    .screenshot();
  const redPixels = await page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (
        pixels[i] > 30 &&
        pixels[i] > pixels[i + 1] * 2 &&
        pixels[i] > pixels[i + 2] * 2
      )
        count++;
    }
    return count;
  }, png.toString("base64"));
  expect(redPixels).toBeGreaterThan(100);
  await page.mouse.click(point.x, point.y);
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = "/atomify/src/store/index.ts";
        const v = (await import(path)).default.getState().render.visualizer;
        return v.selectionTexture.getRGBA(42).r;
      }),
    )
    .toBe(255);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
});
