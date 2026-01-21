import * as THREE from "three";
import { Wall } from "../types";
import { extractBasisVectors, getSimulationBoxBounds } from "./boxGeometry";

// Constants for wall rendering
const WALL_OPACITY = 0.3;
const WALL_COLOR = 0xcccccc; // Light gray/white
const MIN_THICKNESS_2D = 0.1; // Minimum thickness for 2D walls (along z-axis for visibility)

/**
 * Detects if a simulation box is triclinic (non-orthogonal) by checking the cell matrix.
 * A triclinic box has non-zero off-diagonal elements in the matrix.
 * 
 * @param cellMatrix - THREE.Matrix3 representing the simulation box
 * @returns true if the box is triclinic, false if orthogonal
 */
export function isTriclinicBox(cellMatrix: THREE.Matrix3): boolean {
  const { a, b, c } = extractBasisVectors(cellMatrix);
  
  // For an orthogonal box:
  // a = (ax, 0, 0)
  // b = (0, by, 0) or (bx, by, 0) if 2D
  // c = (0, 0, cz) or (cx, cy, cz) if 3D
  // 
  // Check if any off-diagonal elements are non-zero (within tolerance)
  const tolerance = 1e-6;
  
  // Check if a has non-zero y or z components
  if (Math.abs(a.y) > tolerance || Math.abs(a.z) > tolerance) {
    return true;
  }
  
  // Check if b has non-zero z component
  if (Math.abs(b.z) > tolerance) {
    return true;
  }
  
  // Check if c has non-zero x or y components (for 3D)
  if (Math.abs(c.x) > tolerance || Math.abs(c.y) > tolerance) {
    return true;
  }
  
  return false;
}

/**
 * Creates a mesh for a single wall in 3D or 2D.
 * 
 * @param wall - Wall data (which face, position, etc.)
 * @param cellMatrix - THREE.Matrix3 representing the simulation box
 * @param origin - THREE.Vector3 representing the box origin
 * @param dimension - 2 or 3 (LAMMPS dimension)
 * @returns THREE.Mesh for the wall
 */
export function createWallMesh(
  wall: Wall,
  cellMatrix: THREE.Matrix3,
  origin: THREE.Vector3,
  dimension: number,
): THREE.Mesh {
  const { a, b, c } = extractBasisVectors(cellMatrix);
  const boxBounds = getSimulationBoxBounds(cellMatrix, origin);

  // Determine which axis this wall is on
  // XLO=0, XHI=1, YLO=2, YHI=3, ZLO=4, ZHI=5
  const wallDim = Math.floor(wall.which / 2);
  const wallSide = wall.which % 2; // 0 = lo, 1 = hi

  // Get box extents from bounds
  const xSize = boxBounds.max.x - boxBounds.min.x;
  const ySize = boxBounds.max.y - boxBounds.min.y;
  const zSize = boxBounds.max.z - boxBounds.min.z;

  let geometry: THREE.BufferGeometry;
  let position: THREE.Vector3;
  let rotation: THREE.Euler | undefined;

  if (dimension === 2) {
    // 2D: Create a thin plane with minimum thickness along z-axis for visibility
    // For 2D, we view from the side, so walls need some thickness along z-axis to be visible
    
    if (wallDim === 0) {
      // X wall: plane in YZ, with minimum width along X for visibility
      geometry = new THREE.PlaneGeometry(ySize, MIN_THICKNESS_2D);
      position = new THREE.Vector3(
        wall.position,
        boxBounds.min.y + ySize / 2,
        boxBounds.min.z + zSize / 2,
      );
      rotation = new THREE.Euler(0, Math.PI / 2, 0); // Rotate to face along X axis
    } else if (wallDim === 1) {
      // Y wall: plane in XZ, with minimum width along Y for visibility
      geometry = new THREE.PlaneGeometry(xSize, MIN_THICKNESS_2D);
      position = new THREE.Vector3(
        boxBounds.min.x + xSize / 2,
        wall.position,
        boxBounds.min.z + zSize / 2,
      );
      rotation = new THREE.Euler(-Math.PI / 2, 0, 0); // Rotate to face along Y axis
    } else {
      // Z wall shouldn't exist in 2D, but handle it anyway
      geometry = new THREE.PlaneGeometry(xSize, ySize);
      position = new THREE.Vector3(
        boxBounds.min.x + xSize / 2,
        boxBounds.min.y + ySize / 2,
        wall.position,
      );
      rotation = new THREE.Euler(0, 0, 0);
    }
  } else {
    // 3D: Create infinitely thin planes (no thickness) to avoid transparency accumulation
    // Position at the exact wall boundary
    // Use quaternions for proper orientation (avoid gimbal lock with Euler angles)
    
    if (wallDim === 0) {
      // X wall: plane in YZ plane, facing along X axis
      geometry = new THREE.PlaneGeometry(ySize, zSize);
      position = new THREE.Vector3(
        wall.position,  // Exact position at boundary
        boxBounds.min.y + ySize / 2,
        boxBounds.min.z + zSize / 2,
      );
      rotation = undefined; // Will use quaternion instead
    } else if (wallDim === 1) {
      // Y wall: plane in XZ plane, facing along Y axis
      geometry = new THREE.PlaneGeometry(xSize, zSize);
      position = new THREE.Vector3(
        boxBounds.min.x + xSize / 2,
        wall.position,  // Exact position at boundary
        boxBounds.min.z + zSize / 2,
      );
      rotation = undefined; // Will use quaternion instead
    } else {
      // Z wall: plane in XY plane, facing along Z axis
      geometry = new THREE.PlaneGeometry(xSize, ySize);
      position = new THREE.Vector3(
        boxBounds.min.x + xSize / 2,
        boxBounds.min.y + ySize / 2,
        wall.position,  // Exact position at boundary
      );
      rotation = undefined; // Will use quaternion instead
    }
  }

  const material = new THREE.MeshBasicMaterial({
    color: WALL_COLOR,
    transparent: true,
    opacity: WALL_OPACITY,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  
  // Set rotation: use quaternions for 3D (avoid gimbal lock), Euler for 2D
  if (dimension === 3) {
    // Use quaternions for proper plane orientation
    const wallDim = Math.floor(wall.which / 2);
    const wallSide = wall.which % 2;
    const defaultNormal = new THREE.Vector3(0, 0, 1); // PlaneGeometry default normal
    
    let targetNormal: THREE.Vector3;
    if (wallDim === 0) {
      // X wall: face along X axis
      targetNormal = wallSide === 0 
        ? new THREE.Vector3(1, 0, 0)  // XLO: face +X (inward)
        : new THREE.Vector3(-1, 0, 0); // XHI: face -X (inward)
    } else if (wallDim === 1) {
      // Y wall: face along Y axis
      targetNormal = wallSide === 0
        ? new THREE.Vector3(0, 1, 0)  // YLO: face +Y (inward)
        : new THREE.Vector3(0, -1, 0); // YHI: face -Y (inward)
    } else {
      // Z wall: face along Z axis
      targetNormal = wallSide === 0
        ? new THREE.Vector3(0, 0, 1)  // ZLO: face +Z (inward)
        : new THREE.Vector3(0, 0, -1); // ZHI: face -Z (inward)
    }
    
    mesh.quaternion.setFromUnitVectors(defaultNormal, targetNormal);
  } else if (dimension === 2 && rotation !== undefined) {
    // 2D: use Euler angles
    mesh.rotation.copy(rotation);
  }

  return mesh;
}

/**
 * Creates a group containing meshes for all walls.
 * 
 * Note: Walls are not rendered for triclinic boxes because fix wall uses
 * axis-aligned planes which don't align with triclinic box faces.
 * 
 * @param walls - Array of wall data
 * @param cellMatrix - THREE.Matrix3 representing the simulation box
 * @param origin - THREE.Vector3 representing the box origin
 * @param dimension - 2 or 3 (LAMMPS dimension)
 * @returns THREE.Group containing all wall meshes (empty for triclinic boxes)
 */
export function createWallGroup(
  walls: Wall[],
  cellMatrix: THREE.Matrix3,
  origin: THREE.Vector3,
  dimension: number,
): THREE.Group {
  const group = new THREE.Group();

  // Skip wall rendering for 2D - the box boundary already provides visual feedback
  if (dimension === 2) {
    return group; // Return empty group
  }

  // Skip wall rendering for triclinic boxes
  // fix wall uses axis-aligned planes which don't work correctly with triclinic boxes
  if (isTriclinicBox(cellMatrix)) {
    return group; // Return empty group
  }

  for (const wall of walls) {
    const mesh = createWallMesh(wall, cellMatrix, origin, dimension);
    group.add(mesh);
  }

  return group;
}
