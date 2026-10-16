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
  setHiddenParticles,
  syncParticleAttributes,
  applyRadiusAttribute,
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
  it("styles every periodic image that shares an atom's ID", () => {
    const { visualizer: v, particles: p, geometry: g } = fixture();
    p.indices.set([42, 42, 42]);
    p.count = 3;
    syncParticleAttributes(v, p);
    v.setColor(42, { r: 0, g: 0, b: 255 });
    v.setRadius(42, 2);
    expect(Array.from(g.getAttribute("atomColor").array)).toEqual([
      0, 0, 1, 0, 0, 1, 0, 0, 1,
    ]);
    expect(Array.from(g.getAttribute("atomRadius").array)).toEqual([2, 2, 2]);
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
    expect(() => applyRadiusAttribute("void main() {}")).toThrow(
      "Unsupported omovi",
    );
  });
  it("hides instances with zero radius and restores their styled radius", () => {
    const { visualizer: v, particles: p, geometry: g } = fixture();
    syncParticleAttributes(v, p);
    v.setRadius(42, 1.5);
    v.setRadius(900001, 2.5);
    const radius = () =>
      Array.from(g.getAttribute("atomRadius").array).slice(0, 2);

    setHiddenParticles(v, p, new Uint8Array([1, 0]));
    expect(radius()).toEqual([0, 2.5]);
    // Restyling a hidden atom keeps it hidden but remembers the new radius.
    v.setRadius(42, 1.25);
    expect(radius()).toEqual([0, 2.5]);
    setHiddenParticles(v, p, new Uint8Array([0, 1]));
    expect(radius()).toEqual([1.25, 0]);
    setHiddenParticles(v, p, undefined);
    expect(radius()).toEqual([1.25, 2.5]);
  });
  it("keeps hidden periodic images hidden when their atom is restyled", () => {
    const { visualizer: v, particles: p, geometry: g } = fixture();
    p.indices.set([42, 42, 42]);
    p.count = 3;
    syncParticleAttributes(v, p);
    setHiddenParticles(v, p, new Uint8Array([0, 1, 0]));
    v.setRadius(42, 2);
    expect(Array.from(g.getAttribute("atomRadius").array)).toEqual([2, 0, 2]);
  });
  it("drops hide flags when instances are remapped", () => {
    const { visualizer: v, particles: p, geometry: g } = fixture();
    syncParticleAttributes(v, p);
    v.setRadius(42, 1.5);
    setHiddenParticles(v, p, new Uint8Array([1, 0]));
    p.indices.set([900001, 42]);
    syncParticleAttributes(v, p);
    expect(g.getAttribute("atomRadius").getX(1)).toBe(1.5);
    v.setRadius(42, 1.75);
    expect(g.getAttribute("atomRadius").getX(1)).toBe(1.75);
  });
});
