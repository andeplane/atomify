import { describe, expect, it, vi } from "vitest";
import {
  InstancedBufferGeometry,
  InstancedBufferAttribute,
  MeshPhongMaterial,
  ShaderMaterial,
} from "three";
import type { Particles, Visualizer } from "omovi";
import {
  installParticleAttributes,
  syncParticleAttributes,
  useRadiusAttribute,
} from "./particleAttributes";

const radiusShader =
  "uniform sampler2D radiusTexture;\nvoid main() { float particleRadius = unpack(texture2D(radiusTexture, textureIndex)); }";
function fixture() {
  const material = new MeshPhongMaterial();
  const picking = new ShaderMaterial({ vertexShader: radiusShader });
  const oldColor = vi.fn(),
    oldRadius = vi.fn();
  const visualizer = {
    materials: { particles: material },
    pickingHandler: { pickingMaterial: picking },
    setColor: oldColor,
    setRadius: oldRadius,
  } as unknown as Visualizer;
  installParticleAttributes(visualizer);
  const geometry = new InstancedBufferGeometry();
  const particles = {
    capacity: 3,
    count: 2,
    indices: new Float32Array([42, 900001, 0]),
    getGeometry: () => geometry,
  } as unknown as Particles;
  return { visualizer, particles, geometry, oldColor, oldRadius, picking };
}

describe("instance styles", () => {
  it("keeps sparse IDs, exact radii, and colors attached when instances reorder", () => {
    const {
      visualizer: v,
      particles: p,
      geometry: g,
      oldColor,
      oldRadius,
    } = fixture();
    syncParticleAttributes(v, p);
    v.setColor(42, { r: 255, g: 0, b: 0 });
    v.setRadius(42, 0.001);
    v.setColor(900001, { r: 0, g: 255, b: 0 });
    v.setRadius(900001, 3.75);
    p.indices.set([900001, 42]);
    syncParticleAttributes(v, p);
    expect(Array.from(g.getAttribute("atomColor").array)).toEqual([
      0, 1, 0, 1, 0, 0, 0, 0, 0,
    ]);
    expect(g.getAttribute("atomRadius").getX(0)).toBe(3.75);
    expect(g.getAttribute("atomRadius").getX(1)).toBeCloseTo(0.001, 8);
    expect(oldColor).not.toHaveBeenCalled();
    expect(oldRadius).not.toHaveBeenCalled();
  });
  it("does not dirty style buffers when only positions change", () => {
    const { visualizer: v, particles: p, geometry: g } = fixture();
    syncParticleAttributes(v, p);
    const color = g.getAttribute("atomColor") as InstancedBufferAttribute;
    const radius = g.getAttribute("atomRadius") as InstancedBufferAttribute;
    const versions = [color.version, radius.version];
    syncParticleAttributes(v, p);
    expect([color.version, radius.version]).toEqual(versions);
    p.count = 1;
    syncParticleAttributes(v, p);
    expect(radius.version).toBeGreaterThan(versions[1]);
  });
  it("uses attributes for GPU picking and rejects incompatible upstream shaders", () => {
    const { picking } = fixture();
    expect(picking.vertexShader).toContain("attribute float atomRadius;");
    expect(picking.vertexShader).not.toContain("texture2D(radiusTexture");
    expect(() => useRadiusAttribute("void main() {}")).toThrow(
      "Unsupported omovi",
    );
  });
});
