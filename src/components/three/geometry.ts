/**
 * CakeGeometry — procedural geometry for every supported cake shape.
 * All tier geometries are generated with their base at y = 0 and centred on x/z.
 */
import * as THREE from "three";
import { FontLoader, type Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import type { ShapeId } from "@/types/cake";
import { withBase } from "@/lib/basePath";
import type { TierLayout } from "@/lib/cake/dimensions";

const BEVEL = 0.045;

/** 2D outline (x, z) of a tier footprint. Returned as THREE.Shape in shape-space (x, y = -z). */
export function outlineShape(shape: ShapeId, w: number, d: number): THREE.Shape {
  const hw = w / 2;
  const hd = d / 2;
  const s = new THREE.Shape();
  switch (shape) {
    case "square":
    case "rectangle": {
      const r = Math.min(hw, hd) * 0.12;
      s.moveTo(-hw + r, -hd);
      s.lineTo(hw - r, -hd);
      s.quadraticCurveTo(hw, -hd, hw, -hd + r);
      s.lineTo(hw, hd - r);
      s.quadraticCurveTo(hw, hd, hw - r, hd);
      s.lineTo(-hw + r, hd);
      s.quadraticCurveTo(-hw, hd, -hw, hd - r);
      s.lineTo(-hw, -hd + r);
      s.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
      break;
    }
    case "hexagon": {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const x = Math.cos(a) * hw;
        const y = Math.sin(a) * hd;
        if (i === 0) s.moveTo(x, y);
        else s.lineTo(x, y);
      }
      s.closePath();
      break;
    }
    case "heart": {
      // classic heart, point toward +y in shape space (→ -z, back of cake), lobes toward the viewer
      // shape-space +y = world -z (away from the viewer): lobes at the back, tip toward the viewer
      const Y = (v: number) => -v;
      s.moveTo(0, Y(-hd * 0.62));
      s.bezierCurveTo(0, Y(-hd * 0.62), -hw * 0.18, Y(-hd * 1.0), -hw * 0.58, Y(-hd * 1.0));
      s.bezierCurveTo(-hw * 1.08, Y(-hd * 1.0), -hw * 1.06, Y(-hd * 0.3), -hw * 1.0, Y(-hd * 0.18));
      s.bezierCurveTo(-hw * 0.9, Y(hd * 0.25), -hw * 0.4, Y(hd * 0.62), 0, Y(hd * 1.0));
      s.bezierCurveTo(hw * 0.4, Y(hd * 0.62), hw * 0.9, Y(hd * 0.25), hw * 1.0, Y(-hd * 0.18));
      s.bezierCurveTo(hw * 1.06, Y(-hd * 0.3), hw * 1.08, Y(-hd * 1.0), hw * 0.58, Y(-hd * 1.0));
      s.bezierCurveTo(hw * 0.18, Y(-hd * 1.0), 0, Y(-hd * 0.62), 0, Y(-hd * 0.62));
      break;
    }
    case "oval":
      s.absellipse(0, 0, hw, hd, 0, Math.PI * 2, false, 0);
      break;
    default:
      s.absarc(0, 0, hw, 0, Math.PI * 2, false);
  }
  return s;
}

/** outline polygon in world x/z */
export function outlinePoints(shape: ShapeId, w: number, d: number, divisions = 96): THREE.Vector2[] {
  const pts = outlineShape(shape === "dome" || shape === "multi-tier" || shape === "number" || shape === "letter" ? "round" : shape, w, d).getSpacedPoints(divisions);
  // shape-space y → world -z
  return pts.map((p) => new THREE.Vector2(p.x, -p.y));
}

/** Ray-cast from centre at angle θ (in x/z) to find the outline point & outward normal. */
export function outlinePointAtAngle(poly: THREE.Vector2[], angle: number): { point: THREE.Vector2; normal: THREE.Vector2 } {
  const dir = new THREE.Vector2(Math.cos(angle), Math.sin(angle));
  let bestT = 0;
  let bestN = dir.clone();
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i];
    const b = poly[i + 1];
    const e = b.clone().sub(a);
    const den = dir.x * e.y - dir.y * e.x;
    if (Math.abs(den) < 1e-9) continue;
    const t = (a.x * e.y - a.y * e.x) / den;
    const u = (a.x * dir.y - a.y * dir.x) / den;
    if (t > 0 && u >= 0 && u <= 1 && t > bestT) {
      bestT = t;
      const n = new THREE.Vector2(e.y, -e.x).normalize();
      if (n.dot(dir) < 0) n.negate();
      bestN = n;
    }
  }
  return { point: dir.multiplyScalar(bestT || 1), normal: bestN };
}

/* ── Font loading for number / letter cakes ─────────────── */
let fontPromise: Promise<Font> | null = null;
let fontCache: Font | null = null;
export function loadCakeFont(): Promise<Font> {
  if (fontCache) return Promise.resolve(fontCache);
  if (!fontPromise)
    fontPromise = new Promise((resolve, reject) => {
      new FontLoader().load(
        withBase("/fonts/helvetiker_bold.typeface.json"),
        (f) => {
          fontCache = f;
          resolve(f);
        },
        undefined,
        reject
      );
    });
  return fontPromise;
}
export const getLoadedFont = () => fontCache;

/** Build the geometry for one tier. */
export function buildTierGeometry(shape: ShapeId, layout: TierLayout, shapeText: string, font: Font | null): THREE.BufferGeometry {
  const { width: w, depth: d, height: h } = layout;

  if (shape === "dome") {
    const R = w / 2;
    const pts: THREE.Vector2[] = [new THREE.Vector2(0, 0), new THREE.Vector2(R, 0)];
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * (Math.PI / 2);
      pts.push(new THREE.Vector2(R * Math.cos(a) * (1 - 0.001 * i), h * Math.sin(a)));
    }
    const g = new THREE.LatheGeometry(pts, 96);
    g.computeVertexNormals();
    return g;
  }

  if ((shape === "number" || shape === "letter") && font) {
    const text = (shapeText || (shape === "number" ? "1" : "A")).slice(0, 2);
    const g = new TextGeometry(text, {
      font,
      size: 1,
      depth: h - 2 * 0.03,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.025,
      bevelSegments: 4,
      steps: 10,
    });
    g.computeBoundingBox();
    const bb = g.boundingBox!;
    const sx = bb.max.x - bb.min.x;
    const sy = bb.max.y - bb.min.y;
    const k = Math.min(w / sx, d / sy) * 1.0;
    g.translate(-(bb.min.x + sx / 2), -(bb.min.y + sy / 2), 0);
    g.scale(k, k, 1);
    g.rotateX(-Math.PI / 2);
    g.computeBoundingBox();
    g.translate(0, -g.boundingBox!.min.y, 0);
    g.computeVertexNormals();
    return g;
  }

  const s = outlineShape(shape === "multi-tier" || shape === "number" || shape === "letter" ? "round" : shape, w, d);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: h - 2 * BEVEL,
    steps: 18,
    curveSegments: 48,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelOffset: -BEVEL,
    bevelSegments: 5,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, BEVEL, 0);
  g.computeVertexNormals();
  return g;
}

/** Height of the top surface at (x, z) relative to tier base. */
export function topHeightAt(shape: ShapeId, layout: TierLayout, x: number, z: number) {
  if (shape === "dome") {
    const R = layout.width / 2;
    const r2 = Math.min(1, (x * x + z * z) / (R * R));
    return layout.height * Math.sqrt(1 - r2);
  }
  return layout.height;
}

export function topNormalAt(shape: ShapeId, layout: TierLayout, x: number, z: number): THREE.Vector3 {
  if (shape === "dome") {
    const R = layout.width / 2;
    const y = topHeightAt(shape, layout, x, z);
    return new THREE.Vector3(x / (R * R), y / (layout.height * layout.height), z / (R * R)).normalize();
  }
  return new THREE.Vector3(0, 1, 0);
}
