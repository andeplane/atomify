import { expect, test } from "@playwright/test";
import { createBlankProject, gotoApp, waitForEngine } from "./helpers";

const data = `Persistent tags\n\n3 atoms\n3 atom types\n\n0 4 xlo xhi\n0 4 ylo yhi\n0 4 zlo zhi\n\nAtoms # atomic\n\n42 2 3 1 1\n7 1 1 1 1\n99 3 2 1 1\n`;
const script = `units lj\natom_style atomic\natom_modify map array sort 1 0.5\nread_data tags.data\nmass * 1\npair_style zero 0.5\npair_coeff * *\nrun 100000\n`;

test("real engine tags remain attached to atoms when LAMMPS sorts its arrays", async ({
  page,
}) => {
  await gotoApp(page);
  await createBlankProject(page, "Atom tags", "atom-tags");
  await page.getByTestId("upload-input").setInputFiles([
    { name: "tags.data", mimeType: "text/plain", buffer: Buffer.from(data) },
    { name: "in.tags", mimeType: "text/plain", buffer: Buffer.from(script) },
  ]);
  await waitForEngine(page);
  await page.getByTestId("run-file-in.tags").click();
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const modulePath = "/atomify/src/store/index.ts";
          const store = (await import(modulePath)).default;
          const particles = store.getState().render.particles as
            | {
                count: number;
                indices: Float32Array;
                types: Float32Array;
                positions: Float32Array;
              }
            | undefined;
          if (!particles || particles.count !== 3) return [];
          return Array.from(particles.indices.subarray(0, particles.count))
            .map((id, i) => ({
              id,
              type: particles.types[i],
              x: particles.positions[i * 3],
            }))
            .sort((a, b) => a.id - b.id);
        }),
      { timeout: 60_000 },
    )
    .toEqual([
      { id: 7, type: 1, x: 1 },
      { id: 42, type: 2, x: 3 },
      { id: 99, type: 3, x: 2 },
    ]);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
});
