/** Live registry of tier meshes for surface-aware raycasting (placement, snapping, scatter). */
import * as THREE from "three";

export const tierMeshes = new Map<number, THREE.Mesh>();

const raycaster = new THREE.Raycaster();
const DOWN = new THREE.Vector3(0, -1, 0);

export interface SurfaceHit {
  tierIndex: number;
  point: THREE.Vector3;
  normal: THREE.Vector3;
}

function toHit(hit: THREE.Intersection | undefined): SurfaceHit | null {
  if (!hit || !hit.face) return null;
  const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
  return { tierIndex: hit.object.userData.tierIndex as number, point: hit.point.clone(), normal };
}

export function raycastDown(x: number, z: number): SurfaceHit | null {
  const meshes = [...tierMeshes.values()];
  if (!meshes.length) return null;
  meshes.forEach((m) => m.updateMatrixWorld());
  raycaster.set(new THREE.Vector3(x, 50, z), DOWN);
  return toHit(raycaster.intersectObjects(meshes, false)[0]);
}

export function raycastFromCamera(ndc: THREE.Vector2, camera: THREE.Camera): SurfaceHit | null {
  const meshes = [...tierMeshes.values()];
  if (!meshes.length) return null;
  raycaster.setFromCamera(ndc, camera);
  return toHit(raycaster.intersectObjects(meshes, false)[0]);
}
