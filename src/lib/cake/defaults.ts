import type { CakeConfig, CakeExtras, CakeMessage, OccasionId, PhotoConfig, PlacedDecoration, TierConfig } from "@/types/cake";
import { getDecoration } from "@/data/decorations";
import { getOccasion } from "@/data/occasions";
import { uid } from "@/lib/utils";

export const DEFAULT_MESSAGE: CakeMessage = {
  text: "",
  font: "script",
  color: "#4a2a1c",
  size: 1,
  curved: false,
  position: "top-front",
  material: "chocolate",
};

export const DEFAULT_PHOTO: PhotoConfig = {
  dataUrl: null,
  shape: "circle",
  scale: 0.6,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  posX: 0,
  posY: 0,
};

export const DEFAULT_EXTRAS: CakeExtras = {
  dripStyle: "none",
  filling: "classic",
  extraCream: false,
  chocolateCoating: false,
  border: "pearl",
  borderColor: "#fffaf3",
  basePlate: "gold",
  packaging: "premium",
  giftMessage: "",
  specialInstructions: "",
};

export function createTier(partial: Partial<TierConfig> = {}): TierConfig {
  return {
    id: uid("t_"),
    sizeScale: 1,
    flavor: "chocolate",
    frosting: "buttercream",
    colorMode: "solid",
    colors: ["#f4c7c3", "#b76e79"],
    ...partial,
  };
}

export function createDecoration(
  decorationId: string,
  partial: Partial<PlacedDecoration> = {}
): PlacedDecoration {
  const def = getDecoration(decorationId);
  return {
    uid: uid("d_"),
    decorationId,
    tierIndex: 0,
    surface: "top",
    u: 0,
    v: 0,
    rotation: 0,
    scale: 1,
    color: def?.colors[0] ?? "#ffffff",
    size: "M",
    label: def?.defaultLabel,
    ...partial,
  };
}

export function createDefaultConfig(occasion: OccasionId = "birthday"): CakeConfig {
  const occ = getOccasion(occasion);
  const now = Date.now();
  return {
    id: uid("cake_"),
    name: `My ${occ.name} Cake`,
    occasion,
    shape: "round",
    shapeText: "21",
    weightKg: 1,
    eggless: false,
    tiers: [createTier({ colors: [occ.recommendedColors[0], occ.recommendedColors[1]] })],
    decorations: [],
    message: { ...DEFAULT_MESSAGE, text: occ.defaultMessage },
    photo: { ...DEFAULT_PHOTO },
    extras: { ...DEFAULT_EXTRAS },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Distribute `count` items in a ring on the top of a tier using normalized coordinates.
 * The scene's snap resolver will validate them against the actual geometry.
 */
export function ringPositions(count: number, radius = 0.68, phase = 0): { u: number; v: number; rotation: number }[] {
  if (count <= 0) return [];
  if (count === 1) return [{ u: 0, v: 0, rotation: 0 }];
  return Array.from({ length: count }, (_, i) => {
    const a = phase + (i / count) * Math.PI * 2;
    return { u: Math.cos(a) * radius, v: Math.sin(a) * radius, rotation: -a + Math.PI / 2 };
  });
}

/** quick helper to build several decorations of the same type around a ring */
export function ringOf(
  decorationId: string,
  count: number,
  opts: { tierIndex?: number; radius?: number; color?: string; phase?: number; size?: PlacedDecoration["size"]; surface?: "top" | "side"; height?: number } = {}
): PlacedDecoration[] {
  if (opts.surface === "side") {
    return Array.from({ length: count }, (_, i) =>
      createDecoration(decorationId, {
        tierIndex: opts.tierIndex ?? 0,
        surface: "side",
        u: (opts.phase ?? 0) + (i / count) * Math.PI * 2,
        v: opts.height ?? 0.5,
        color: opts.color ?? getDecoration(decorationId)?.colors[0],
        size: opts.size ?? "M",
      })
    );
  }
  return ringPositions(count, opts.radius ?? 0.68, opts.phase ?? 0).map((p) =>
    createDecoration(decorationId, {
      tierIndex: opts.tierIndex ?? 0,
      surface: "top",
      ...p,
      rotation: defaultRotation(decorationId, p.u, p.v),
      color: opts.color ?? getDecoration(decorationId)?.colors[0],
      size: opts.size ?? "M",
      pendingSnap: true,
    })
  );
}

const FRONT_FACING = new Set(["topper", "plaque", "couple", "bride-groom", "dancing-couple", "person", "teddy", "number-candle", "letter", "custom-figurine", "rainbow", "ring", "crown"]);

/** Default rotation for a decoration placed at (u, v) on top: figurines & toppers face the viewer, others face outward. */
export function defaultRotation(decorationId: string, u: number, v: number) {
  const def = getDecoration(decorationId);
  if (def && FRONT_FACING.has(def.model)) return 0;
  return Math.hypot(u, v) < 0.05 ? 0 : Math.atan2(u, v);
}

/** wrap an angle to [-π, π] */
export const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
