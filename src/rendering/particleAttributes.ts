import type { Particles, Visualizer } from "omovi";
import {
  DynamicDrawUsage,
  InstancedBufferAttribute,
  type ShaderMaterial,
} from "three";

type Color = { r: number; g: number; b: number };
type Style = { color: Color; radius: number };
type AttributeState = {
  styles: Map<number, Style>;
  slots: Map<number, number>;
  particles?: Particles;
  ids?: Float32Array;
  count?: number;
  color?: InstancedBufferAttribute;
  radius?: InstancedBufferAttribute;
};
const states = new WeakMap<Visualizer, AttributeState>();
const patchedMaterials = new WeakSet<object>();

function replaceRequired(
  source: string,
  before: string,
  after: string,
): string {
  if (!source.includes(before))
    throw new Error(
      "Unsupported omovi particle shader: update the attribute adapter.",
    );
  return source.replace(before, after);
}

/** omovi 0.25 uses the same radius expression for drawing and GPU picking. */
export function useRadiusAttribute(source: string): string {
  return replaceRequired(
    replaceRequired(
      source,
      "uniform sampler2D radiusTexture;",
      "attribute float atomRadius;",
    ),
    "unpack(texture2D(radiusTexture, textureIndex))",
    "atomRadius",
  );
}

/**
 * Keep this compatibility boundary in one place until omovi exposes instance
 * styles itself. Drawing and picking must consume the same radius attribute.
 * Fail explicitly on incompatible shader changes instead of rendering wrong
 * sizes or leaving click targets on the old texture path.
 */
export function installParticleAttributes(visualizer: Visualizer): void {
  if (states.has(visualizer)) return;
  const material = visualizer.materials.particles;
  const picking = (
    visualizer as unknown as {
      pickingHandler: { pickingMaterial: ShaderMaterial };
    }
  ).pickingHandler.pickingMaterial;
  if (!patchedMaterials.has(material)) {
    const originalCompile = material.onBeforeCompile;
    material.onBeforeCompile = (shader, renderer) => {
      originalCompile.call(material, shader, renderer);
      shader.vertexShader = useRadiusAttribute(shader.vertexShader);
      shader.vertexShader =
        "attribute vec3 atomColor;\nvarying vec3 vAtomColor;\n" +
        replaceRequired(
          shader.vertexShader,
          "void main() {",
          "void main() {\n vAtomColor = atomColor;",
        );
      shader.fragmentShader =
        "varying vec3 vAtomColor;\n" +
        replaceRequired(
          shader.fragmentShader,
          "texture2D(colorTexture, textureIndex)",
          "vec4(vAtomColor, 1.0)",
        );
      shader.fragmentShader = shader.fragmentShader.replace(
        "uniform sampler2D colorTexture;",
        "",
      );
      delete shader.uniforms.colorTexture;
      delete shader.uniforms.radiusTexture;
    };
    material.customProgramCacheKey = () => "atomify-particle-attributes-v1";
    patchedMaterials.add(material);
  }
  picking.vertexShader = useRadiusAttribute(picking.vertexShader);
  material.needsUpdate = true;
  picking.needsUpdate = true;
  const state: AttributeState = { styles: new Map(), slots: new Map() };
  states.set(visualizer, state);
  const styleFor = (id: number) => {
    let style = state.styles.get(id);
    if (!style) {
      style = { color: { r: 255, g: 255, b: 255 }, radius: 0.33 };
      state.styles.set(id, style);
    }
    return style;
  };
  visualizer.setColor = (id, color) => {
    styleFor(id).color = color;
    const slot = state.slots.get(id);
    if (slot !== undefined && state.color) {
      state.color.setXYZ(slot, color.r / 255, color.g / 255, color.b / 255);
      state.color.needsUpdate = true;
    }
    visualizer.forceRender = true;
  };
  visualizer.setRadius = (id, radius) => {
    styleFor(id).radius = radius;
    const slot = state.slots.get(id);
    if (slot !== undefined && state.radius) {
      state.radius.setX(slot, radius);
      state.radius.needsUpdate = true;
    }
    visualizer.forceRender = true;
  };
}

/** Refresh the ID-to-instance mapping before modifiers apply styles. */
export function syncParticleAttributes(
  visualizer: Visualizer | undefined,
  particles: Particles,
): void {
  const state = visualizer && states.get(visualizer);
  if (!state) return;
  if (state.particles !== particles) {
    state.particles = particles;
    state.ids = new Float32Array(particles.capacity);
    state.count = -1;
    state.color = new InstancedBufferAttribute(
      new Float32Array(particles.capacity * 3),
      3,
    ).setUsage(DynamicDrawUsage);
    state.radius = new InstancedBufferAttribute(
      new Float32Array(particles.capacity),
      1,
    ).setUsage(DynamicDrawUsage);
    const geometry = particles.getGeometry();
    geometry.setAttribute("atomColor", state.color);
    geometry.setAttribute("atomRadius", state.radius);
  }
  if (
    state.count === particles.count &&
    particles.indices
      .subarray(0, particles.count)
      .every((id, i) => id === state.ids![i])
  )
    return;
  state.ids!.set(particles.indices.subarray(0, particles.count));
  state.count = particles.count;
  state.slots.clear();
  for (let i = 0; i < particles.count; i++) {
    const id = particles.indices[i];
    state.slots.set(id, i);
    const style = state.styles.get(id);
    const color = style?.color ?? { r: 255, g: 255, b: 255 };
    state.color!.setXYZ(i, color.r / 255, color.g / 255, color.b / 255);
    state.radius!.setX(i, style?.radius ?? 0.33);
  }
  // Remove disappeared IDs so repeated runs don't retain unbounded style maps.
  for (const id of state.styles.keys())
    if (!state.slots.has(id)) state.styles.delete(id);
  state.color!.needsUpdate = true;
  state.radius!.needsUpdate = true;
}
