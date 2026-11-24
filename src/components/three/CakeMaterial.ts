/**
 * CakeMaterial — PBR material presets & procedural textures for each frosting type.
 * Colours are applied through vertex colours (see colorize) so gradients work on any geometry.
 */
import * as THREE from "three";
import type { ColorMode, FrostingId, TierConfig } from "@/types/cake";
import { FLAVORS } from "@/data/catalog";

/* ── Procedural textures (generated once, shared) ─────── */
const texCache = new Map<string, THREE.Texture>();

function noiseCanvas(size: number, scale: number, seed: number, style: "soft" | "sponge" | "fine" | "swirl") {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const count = style === "fine" ? 9000 : style === "sponge" ? 5000 : style === "swirl" ? 220 : 1400;
  for (let i = 0; i < count; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = (style === "fine" ? 0.8 : style === "sponge" ? 2.2 : style === "swirl" ? 22 : 9) * scale * (0.4 + rnd());
    const v = Math.floor(rnd() * 255);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const a = style === "swirl" ? 0.12 : style === "sponge" ? 0.6 : 0.22;
    g.addColorStop(0, `rgba(${v},${v},${v},${a})`);
    g.addColorStop(1, `rgba(${v},${v},${v},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  if (style === "swirl") {
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 6 * scale;
    for (let i = 0; i < 26; i++) {
      ctx.beginPath();
      const y0 = rnd() * size;
      ctx.moveTo(0, y0);
      for (let x = 0; x <= size; x += 16) ctx.lineTo(x, y0 + Math.sin(x / (30 + rnd() * 30)) * 10 * scale);
      ctx.stroke();
    }
  }
  return c;
}

export function getBumpTexture(kind: "soft" | "sponge" | "fine" | "swirl"): THREE.Texture | null {
  if (typeof document === "undefined") return null;
  const cached = texCache.get(kind);
  if (cached) return cached;
  const t = new THREE.CanvasTexture(noiseCanvas(512, 1, kind.length * 977 + 13, kind));
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2.5, 2.5);
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 4;
  texCache.set(kind, t);
  return t;
}

export interface FrostingPreset {
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  sheen: number;
  sheenRoughness: number;
  bump: "soft" | "sponge" | "fine" | "swirl" | null;
  bumpScale: number;
  envMapIntensity: number;
}

export const FROSTING_PRESETS: Record<FrostingId, FrostingPreset> = {
  buttercream: { roughness: 0.72, metalness: 0, clearcoat: 0.05, clearcoatRoughness: 0.6, sheen: 0.25, sheenRoughness: 0.8, bump: "swirl", bumpScale: 1.4, envMapIntensity: 0.6 },
  "whipped-cream": { roughness: 0.95, metalness: 0, clearcoat: 0, clearcoatRoughness: 1, sheen: 0.4, sheenRoughness: 1, bump: "soft", bumpScale: 3, envMapIntensity: 0.45 },
  ganache: { roughness: 0.2, metalness: 0.05, clearcoat: 0.85, clearcoatRoughness: 0.12, sheen: 0, sheenRoughness: 0.5, bump: "fine", bumpScale: 0.3, envMapIntensity: 1.2 },
  fondant: { roughness: 0.55, metalness: 0, clearcoat: 0.1, clearcoatRoughness: 0.5, sheen: 0.35, sheenRoughness: 0.6, bump: null, bumpScale: 0, envMapIntensity: 0.7 },
  "cream-cheese": { roughness: 0.82, metalness: 0, clearcoat: 0, clearcoatRoughness: 1, sheen: 0.2, sheenRoughness: 0.9, bump: "soft", bumpScale: 1.6, envMapIntensity: 0.5 },
  "mirror-glaze": { roughness: 0.03, metalness: 0.12, clearcoat: 1, clearcoatRoughness: 0.02, sheen: 0, sheenRoughness: 0.5, bump: null, bumpScale: 0, envMapIntensity: 2.2 },
  naked: { roughness: 0.95, metalness: 0, clearcoat: 0, clearcoatRoughness: 1, sheen: 0, sheenRoughness: 1, bump: "sponge", bumpScale: 4, envMapIntensity: 0.3 },
  "semi-naked": { roughness: 0.9, metalness: 0, clearcoat: 0, clearcoatRoughness: 1, sheen: 0.1, sheenRoughness: 1, bump: "sponge", bumpScale: 2.5, envMapIntensity: 0.35 },
  velvet: { roughness: 1, metalness: 0, clearcoat: 0, clearcoatRoughness: 1, sheen: 1, sheenRoughness: 0.35, bump: "fine", bumpScale: 1.2, envMapIntensity: 0.3 },
  "chocolate-drip": { roughness: 0.68, metalness: 0, clearcoat: 0.05, clearcoatRoughness: 0.6, sheen: 0.2, sheenRoughness: 0.8, bump: "swirl", bumpScale: 1.2, envMapIntensity: 0.6 },
};

export function makeFrostingMaterial(tier: TierConfig): THREE.MeshPhysicalMaterial {
  const p = FROSTING_PRESETS[tier.frosting];
  const metallic = tier.colorMode === "gold" || tier.colorMode === "silver";
  const m = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    color: 0xffffff,
    roughness: metallic ? 0.28 : p.roughness,
    metalness: metallic ? 0.92 : p.metalness,
    clearcoat: metallic ? 0.5 : p.clearcoat,
    clearcoatRoughness: p.clearcoatRoughness,
    sheen: metallic ? 0 : p.sheen,
    sheenRoughness: p.sheenRoughness,
    sheenColor: new THREE.Color(tier.colors[0]).lerp(new THREE.Color("#ffffff"), 0.5),
    envMapIntensity: metallic ? 1.6 : p.envMapIntensity,
  });
  const bump = p.bump ? getBumpTexture(p.bump) : null;
  if (bump) {
    m.bumpMap = bump;
    m.bumpScale = p.bumpScale;
  }
  return m;
}

/* ── Vertex colouring ─────────────────────────────────── */
const tmp = new THREE.Color();
const tmp2 = new THREE.Color();

export interface ColorTargets {
  c1: THREE.Color;
  c2: THREE.Color;
}

export function colorize(geometry: THREE.BufferGeometry, tier: TierConfig, height: number, cols: ColorTargets) {
  const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
  const nor = geometry.getAttribute("normal") as THREE.BufferAttribute;
  let colorAttr = geometry.getAttribute("color") as THREE.BufferAttribute | undefined;
  if (!colorAttr || colorAttr.count !== pos.count) {
    colorAttr = new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3);
    geometry.setAttribute("color", colorAttr);
  }
  const flavor = FLAVORS.find((f) => f.id === tier.flavor) ?? FLAVORS[0];
  const sponge = new THREE.Color(flavor.sponge);
  const cream = new THREE.Color(flavor.cream).lerp(cols.c1, 0.25);
  const mode: ColorMode = tier.colorMode;
  const gold = new THREE.Color("#d9b04c");
  const silver = new THREE.Color("#d4d7dd");
  const naked = tier.frosting === "naked";
  const semi = tier.frosting === "semi-naked";
  const layers = 3;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const ny = nor ? nor.getY(i) : 0;
    const t = Math.min(1, Math.max(0, y / height));
    const isTop = ny > 0.6;

    switch (mode) {
      case "two-tone":
        tmp.copy(isTop || t > 0.5 ? cols.c1 : cols.c2);
        if (!isTop && Math.abs(t - 0.5) < 0.04) tmp.lerpColors(cols.c2, cols.c1, (t - 0.46) / 0.08);
        break;
      case "ombre":
        tmp.lerpColors(cols.c2, cols.c1, isTop ? 1 : Math.pow(t, 0.9));
        break;
      case "rainbow": {
        const h = isTop ? (Math.atan2(z, x) / (Math.PI * 2) + 1) % 1 : 0.83 * (1 - t);
        tmp.setHSL(h, 0.62, 0.72);
        break;
      }
      case "gold":
        tmp.copy(gold);
        break;
      case "silver":
        tmp.copy(silver);
        break;
      default:
        tmp.copy(cols.c1);
    }

    if ((naked || semi) && !isTop) {
      // exposed sponge layers with cream between them
      const band = (t * layers) % 1;
      const isCream = band > 0.78 || t < 0.04;
      tmp2.copy(isCream ? cream : sponge);
      if (naked) tmp.copy(tmp2);
      else {
        const n = 0.5 + 0.5 * Math.sin(x * 11.3 + z * 9.7 + y * 23.1) * Math.cos(x * 4.1 - z * 6.3);
        tmp.lerp(tmp2, Math.min(1, Math.max(0, (n - 0.35) * 1.8)));
      }
    } else if (naked && isTop) {
      tmp.copy(cream);
    }
    colorAttr.setXYZ(i, tmp.r, tmp.g, tmp.b);
  }
  colorAttr.needsUpdate = true;
}
