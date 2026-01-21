import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createWallMesh, createWallGroup } from './wallGeometry';
import { Wall } from '../types';

describe('wallGeometry', () => {
  describe('createWallMesh', () => {
    const cellMatrix = new THREE.Matrix3().set(
      20, 0, 0,
      0, 20, 0,
      0, 0, 20
    );
    const origin = new THREE.Vector3(-10, -10, -10);

    it.each([
      [0, -10, 3, 'XLO'],
      [1, 10, 3, 'XHI'],
      [2, -10, 3, 'YLO'],
      [3, 10, 3, 'YHI'],
      [4, -10, 3, 'ZLO'],
      [5, 10, 3, 'ZHI'],
    ])('should create correct 3D mesh for wall %s (%s) at position %s', (which, position, dimension, label) => {
      const wall: Wall = { which, style: 1, position, cutoff: 2.5 };
      const mesh = createWallMesh(wall, cellMatrix, origin, dimension);

      expect(mesh).toBeInstanceOf(THREE.Mesh);
      expect(mesh.position[label.startsWith('X') ? 'x' : label.startsWith('Y') ? 'y' : 'z']).toBeCloseTo(position);
      
      const material = mesh.material as THREE.MeshBasicMaterial;
      expect(material.transparent).toBe(true);
      expect(material.opacity).toBe(0.04);
    });

    it('should create correct 2D mesh for XLO wall', () => {
      const wall: Wall = { which: 0, style: 1, position: -10, cutoff: 2.5 };
      const mesh = createWallMesh(wall, cellMatrix, origin, 2);

      expect(mesh).toBeInstanceOf(THREE.Mesh);
      expect(mesh.position.x).toBeCloseTo(-10);
      // In 2D, X wall is rotated
      expect(mesh.rotation.y).toBeCloseTo(Math.PI / 2);
    });
  });

  describe('createWallGroup', () => {
    const cellMatrix = new THREE.Matrix3().set(20, 0, 0, 0, 20, 0, 0, 0, 20);
    const origin = new THREE.Vector3(-10, -10, -10);
    const walls: Wall[] = [
      { which: 0, style: 1, position: -10, cutoff: 2.5 },
      { which: 1, style: 1, position: 10, cutoff: 2.5 },
    ];

    it('should create a group with meshes in 3D', () => {
      const group = createWallGroup(walls, cellMatrix, origin, 3);
      expect(group.children.length).toBe(2);
    });

    it('should return empty group in 2D', () => {
      const group = createWallGroup(walls, cellMatrix, origin, 2);
      expect(group.children.length).toBe(0);
    });

    it('should return empty group for triclinic box', () => {
      const triclinicMatrix = new THREE.Matrix3().set(20, 5, 0, 0, 20, 0, 0, 0, 20);
      const group = createWallGroup(walls, triclinicMatrix, origin, 3);
      expect(group.children.length).toBe(0);
    });
  });
});
