/**
 * DecorationPlacement — maps the resolution-independent (u, v) placement of a decoration
 * onto the actual 3D cake surface, and maps raycast hits back to (u, v).
 */
import * as THREE from "three";
import type { CakeConfig, DecorationModel, PlacedDecoration } from "@/types/cake";
import type { TierLayout } from "@/lib/cake/dimensions";
import { outlinePointAtAngle, outlinePoints, topHeightAt, topNormalAt } from "./geometry";

/** models that face outward with their "front" (+Z) when on a side; others stick out along +Y */
const STICK_ON_SIDE: DecorationModel[] = ["rose", "flower", "sunflower", "orchid", "lotus", "pearls", "ball", "diamond", "gold-leaf", "blueberry", "raspberry"];

const UP = new THREE.Vector3(0, 1, 0);

const polyCache = new Map<string, THREE.Vector2[]>();
export function tierPolygon(shape: CakeConfig["shape"], l: TierLayout) {
  const key = `${shape}:${l.width.toFixed(3)}:${l.depth.toFixed(3)}`;
  let p = polyCache.get(key);
  if (!p) {
    p = outlinePoints(shape, l.width, l.depth, 128);
    polyCache.set(key, p);
    if (polyCache.size > 200) polyCache.delete(polyCache.keys().next().value!);
  }
  return p;
}

export interface WorldTransform {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  normal: THREE.Vector3;
}

export function decorationTransform(d: PlacedDecoration, layouts: TierLayout[], shape: CakeConfig["shape"], model: DecorationModel): WorldTransform | null {
  const l = layouts[d.tierIndex] ?? layouts[layouts.length - 1];
  if (!l) return null;

  if (d.surface === "top" || shape === "number" || shape === "letter") {
    const x = d.u * (l.width / 2);
    const z = d.v * (l.depth / 2);
    const y = l.y + topHeightAt(shape, l, x, z);
    const normal = topNormalAt(shape, l, x, z);
    const q = new THREE.Quaternion().setFromUnitVectors(UP, normal);
    q.multiply(new THREE.Quaternion().setFromAxisAngle(UP, d.rotation));
    return { position: new THREE.Vector3(x, y, z), quaternion: q, normal };
  }

  // side placement
  if (shape === "dome") {
    const R = l.width / 2;
    const yy = Math.min(0.92, Math.max(0.05, d.v)) * l.height;
    const r = R * Math.sqrt(Math.max(0, 1 - (yy * yy) / (l.height * l.height)));
    const x = Math.cos(d.u) * r;
    const z = Math.sin(d.u) * r;
    const normal = new THREE.Vector3(x / (R * R), yy / (l.height * l.height), z / (R * R)).normalize();
    return orientSide(new THREE.Vector3(x, l.y + yy, z), normal, d.rotation, model);
  }
  const poly = tierPolygon(shape, l);
  const { point, normal: n2 } = outlinePointAtAngle(poly, d.u);
  const normal = new THREE.Vector3(n2.x, 0, n2.y).normalize();
  const y = l.y + Math.min(0.92, Math.max(0.08, d.v)) * l.height;
  return orientSide(new THREE.Vector3(point.x, y, point.y), normal, d.rotation, model);
}

function orientSide(position: THREE.Vector3, normal: THREE.Vector3, rotation: number, model: DecorationModel): WorldTransform {
  let q: THREE.Quaternion;
  if (STICK_ON_SIDE.includes(model)) {
    q = new THREE.Quaternion().setFromUnitVectors(UP, normal);
    q.multiply(new THREE.Quaternion().setFromAxisAngle(UP, rotation));
  } else {
    // face outward: local +Z → normal, local +Y → world up
    const m = new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), normal.clone().negate(), UP);
    q = new THREE.Quaternion().setFromRotationMatrix(m);
    q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rotation));
  }
  return { position: position.add(normal.clone().multiplyScalar(0.012)), quaternion: q, normal };
}

/** Convert a raycast hit on a tier into a placement. */
export function hitToPlacement(point: THREE.Vector3, worldNormal: THREE.Vector3, tierIndex: number, layouts: TierLayout[], shape: CakeConfig["shape"]): Pick<PlacedDecoration, "tierIndex" | "surface" | "u" | "v"> {
  const l = layouts[tierIndex];
  const isTop = worldNormal.y > 0.55 || shape === "number" || shape === "letter";
  if (isTop) {
    return {
      tierIndex,
      surface: "top",
      u: THREE.MathUtils.clamp(point.x / (l.width / 2), -1, 1),
      v: THREE.MathUtils.clamp(point.z / (l.depth / 2), -1, 1),
    };
  }
  return {
    tierIndex,
    surface: "side",
    u: Math.atan2(point.z, point.x),
    v: THREE.MathUtils.clamp((point.y - l.y) / l.height, 0.08, 0.92),
  };
}
