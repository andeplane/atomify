import { expect, test } from "@playwright/test";
import { gotoApp } from "./helpers";

test("viewport lighting remains visible beyond the old light cutoff", async ({
  page,
}) => {
  await gotoApp(page);
  const result = await page.evaluate(async () => {
    const threePath = "/atomify/node_modules/three/build/three.module.js";
    const lightingPath = "/atomify/src/utils/lighting.ts";
    const THREE = await import(threePath);
    const { applyLighting } = await import(lightingPath);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(256, 256);
    const target = new THREE.WebGLRenderTarget(256, 256);
    const scene = new THREE.Scene();
    const material = new THREE.MeshPhongMaterial({ color: 0x7788ff });
    const geometry = new THREE.SphereGeometry(1, 48, 32);
    scene.add(new THREE.Mesh(geometry, material));
    const pointLight = new THREE.PointLight(0xffffff, 20, 200, 0.8);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
    scene.add(pointLight, ambientLight);
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10000);
    const sample = (distance: number) => {
      camera.position.set(0, 0, distance);
      camera.fov =
        (2 *
          Math.atan((Math.tan((35 * Math.PI) / 360) * 10) / distance) *
          180) /
        Math.PI;
      camera.updateProjectionMatrix();
      camera.lookAt(0, 0, 0);
      pointLight.position.copy(camera.position);
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      const pixels = new Uint8Array(256 * 256 * 4);
      renderer.readRenderTargetPixels(target, 0, 0, 256, 256, pixels);
      let sum = 0;
      for (let i = 0; i < pixels.length; i += 4)
        sum += pixels[i] + pixels[i + 1] + pixels[i + 2];
      return sum;
    };
    const oldNear = sample(10),
      oldFar = sample(1000);
    applyLighting(
      { pointLight, ambientLight },
      { pointLightIntensity: 20, ambientLightIntensity: 0.05 },
    );
    const near = sample(10),
      far = sample(1000);
    renderer.dispose();
    target.dispose();
    geometry.dispose();
    material.dispose();
    return { oldNear, oldFar, near, far };
  });
  expect(result.oldFar).toBeLessThan(result.oldNear * 0.4);
  expect(result.far).toBeGreaterThan(result.near * 0.85);
  expect(result.far).toBeLessThan(result.near * 1.15);
  expect(result.near).toBeGreaterThan(10000);
});
