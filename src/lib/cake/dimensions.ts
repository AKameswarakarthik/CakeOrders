/**
 * Pure (non-three) physical layout of the cake. Used by the 3D scene,
 * the 2D fallback preview, auto-placement and validation.
 */
import type { CakeConfig, ShapeId } from "@/types/cake";

export interface TierLayout {
  index: number;
  /** footprint width (x) & depth (z) */
  width: number;
  depth: number;
  height: number;
  /** bottom y of tier */
  y: number;
  /** fraction of total weight in this tier */
  weightShare: number;
}

export const TIER_GAP = 0.0;

export function footprintAspect(shape: ShapeId): [number, number] {
  switch (shape) {
    case "rectangle":
      return [1.3, 0.85];
    case "oval":
      return [1.25, 0.88];
    case "square":
      return [0.92, 0.92];
    case "heart":
      return [1.08, 1.0];
    case "number":
    case "letter":
      return [1.1, 1.1];
    default:
      return [1, 1];
  }
}

export function computeTierLayout(config: Pick<CakeConfig, "shape" | "weightKg" | "tiers">): TierLayout[] {
  const n = Math.max(1, config.tiers.length);
  const W = Math.max(0.5, config.weightKg);
  const perTier = W / n;
  const base = 0.7 + 0.32 * Math.sqrt(perTier * (n > 1 ? 1.4 : 1));
  const h = 0.42 + 0.09 * Math.min(perTier, 4);
  const [ax, az] = footprintAspect(config.shape);
  const scales = config.tiers.map((t, i) => (1 - i * (n > 3 ? 0.17 : 0.22)) * (t.sizeScale ?? 1));
  const areaSum = scales.reduce((s, k) => s + k * k, 0);

  let y = 0;
  return config.tiers.map((_, i) => {
    const s = scales[i];
    const R = base * s;
    const height = config.shape === "dome" ? R * 0.95 : config.shape === "number" || config.shape === "letter" ? h * 0.9 : h;
    const layout: TierLayout = {
      index: i,
      width: 2 * R * ax,
      depth: 2 * R * az,
      height,
      y,
      weightShare: (s * s) / areaSum,
    };
    y += height + TIER_GAP;
    return layout;
  });
}

export const totalHeight = (layout: TierLayout[]) =>
  layout.length ? layout[layout.length - 1].y + layout[layout.length - 1].height : 1;

export const servingsFor = (kg: number) => Math.round(kg * 8);
