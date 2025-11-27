import * as THREE from "three";

// Constants for box geometry rendering
const RADIUS_SCALE_FACTOR = 0.0015;
const MIN_RADIUS = 0.1;
const CYLINDER_RADIAL_SEGMENTS = 8;
const ZERO_LENGTH_THRESHOLD = 1e-4;
const MIN_NORMALIZED_LENGTH = 0.001;

/**
 * Calculates an appropriate radius for box wireframe edges based on the cell matrix.
 * Uses RADIUS_SCALE_FACTOR of the average basis vector length, with a minimum of MIN_RADIUS.
 *
 * @param cellMatrix - THREE.Matrix3 where rows represent the a, b, c vectors (LAMMPS convention)
 * @returns Calculated radius for wireframe edges
 */
export function calculateBoxRadius(cellMatrix: THREE.Matrix3): number {
  // LAMMPS stores vectors as rows, but extractBasis gets columns - transpose first
  const transposed = cellMatrix.clone().transpose();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  transposed.extractBasis(a, b, c);

  const avgLength = (a.length() + b.length() + c.length()) / 3;
  return Math.max(avgLength * RADIUS_SCALE_FACTOR, MIN_RADIUS);
}

/**
 * Creates a Group of cylinders for a parallelepiped wireframe from a cell matrix and origin.
 * Handles both orthogonal and triclinic (non-orthogonal) simulation boxes.
 * Uses cylinders instead of lines to ensure proper thickness across all systems.
 * 
 * @param cellMatrix - THREE.Matrix3 where rows represent the a, b, c vectors (LAMMPS convention)
 * @param origin - THREE.Vector3 representing the origin point
 * @param radius - Radius of the cylinder edges (default: MIN_RADIUS)
 * @returns THREE.Group containing cylinder meshes for each edge
 */
export function createBoxGeometry(
  cellMatrix: THREE.Matrix3,
  origin: THREE.Vector3,
  radius: number = MIN_RADIUS,
): THREE.Group {
  // The cell matrix from LAMMPS stores vectors as ROWS, but extractBasis gets COLUMNS
  // So we need to transpose the matrix first
  const transposed = cellMatrix.clone().transpose();
  
  // Extract column vectors from the transposed matrix (which are the original rows)
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  transposed.extractBasis(a, b, c);

  // Compute the 8 vertices of the parallelepiped
  const vertices: THREE.Vector3[] = [
    origin.clone(), // v0
    origin.clone().add(a), // v1
    origin.clone().add(b), // v2
    origin.clone().add(c), // v3
    origin.clone().add(a).add(b), // v4
    origin.clone().add(a).add(c), // v5
    origin.clone().add(b).add(c), // v6
    origin.clone().add(a).add(b).add(c), // v7
  ];

  // Define the 12 edges of the parallelepiped
  // Each edge is represented by two vertex indices
  const edges = [
    // Bottom face (z = 0 plane)
    [0, 1], // v0 -> v1
    [1, 4], // v1 -> v4
    [4, 2], // v4 -> v2
    [2, 0], // v2 -> v0
    // Top face (z = c plane)
    [3, 5], // v3 -> v5
    [5, 7], // v5 -> v7
    [7, 6], // v7 -> v6
    [6, 3], // v6 -> v3
    // Vertical edges connecting bottom to top
    [0, 3], // v0 -> v3
    [1, 5], // v1 -> v5
    [4, 7], // v4 -> v7
    [2, 6], // v2 -> v6
  ];

  const group = new THREE.Group();
  
  // Create material once and reuse for all edges
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });

  // Create a cylinder for each edge
  edges.forEach(([i, j]) => {
    const start = vertices[i];
    const end = vertices[j];
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();

    if (length < ZERO_LENGTH_THRESHOLD) {
      // Skip zero-length edges
      return;
    }

    // Create cylinder geometry (default orientation is along Y-axis)
    const geometry = new THREE.CylinderGeometry(
      radius,
      radius,
      length,
      CYLINDER_RADIAL_SEGMENTS,
    );

    // Create mesh
    const cylinder = new THREE.Mesh(geometry, material);

    // Position at midpoint
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    cylinder.position.copy(midpoint);
    
    // Orient cylinder along the edge direction
    const targetAxis = direction.clone().normalize();
    
    // Validate targetAxis is valid
    if (
      !isFinite(targetAxis.x) ||
      !isFinite(targetAxis.y) ||
      !isFinite(targetAxis.z) ||
      targetAxis.length() < MIN_NORMALIZED_LENGTH
    ) {
      // Invalid direction, skip this edge
      geometry.dispose();
      return;
    }
    
    // Align cylinder to edge direction
    cylinder.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      targetAxis
    );
    
    // Validate final quaternion
    if (
      !isFinite(cylinder.quaternion.x) ||
      !isFinite(cylinder.quaternion.y) ||
      !isFinite(cylinder.quaternion.z) ||
      !isFinite(cylinder.quaternion.w)
    ) {
      // Last resort: identity quaternion
      cylinder.quaternion.set(0, 0, 0, 1);
    }

    group.add(cylinder);
  });

  return group;
}


