import type { CakeConfig, DesignWarning, PlacedDecoration } from "@/types/cake";
import { FROSTINGS, MIN_WEIGHT_FOR_TIERS, SHAPES } from "@/data/catalog";
import { getDecoration, SIZE_FACTOR } from "@/data/decorations";
import { computeTierLayout } from "./dimensions";

/** Design-level checks: physical feasibility and bakery-approval flags. */
export function validateDesign(config: CakeConfig): DesignWarning[] {
  const w: DesignWarning[] = [];
  const n = config.tiers.length;
  const shape = SHAPES.find((s) => s.id === config.shape)!;

  if (n > shape.maxTiers) w.push({ level: "error", message: `${shape.name} cakes support up to ${shape.maxTiers} tier(s).` });
  const minW = MIN_WEIGHT_FOR_TIERS[n] ?? 0.5;
  if (config.weightKg < minW) w.push({ level: "error", message: `${n} tiers need at least ${minW} kg to be structurally stable.` });
  if (n >= 4) w.push({ level: "approval", message: `${n}-tier cakes are hand-assembled on-site and need bakery approval.` });
  if (config.weightKg > 10) w.push({ level: "approval", message: "Cakes above 10 kg require 48h notice and bakery approval." });
  if (config.tiers.some((t) => t.flavor === "custom")) w.push({ level: "approval", message: "Custom flavours are confirmed by our chef after ordering." });

  config.tiers.forEach((t, i) => {
    const frosting = FROSTINGS.find((f) => f.id === t.frosting)!;
    const heavy = config.decorations.filter((d) => d.tierIndex === i && getDecoration(d.decorationId)?.heavy);
    if (!frosting.firm && heavy.length)
      w.push({ level: "approval", message: `${frosting.name} on tier ${i + 1} is soft — heavy figurines may need a firmer frosting (bakery will advise).` });
    if (t.frosting === "mirror-glaze" && n > 1 && i < n - 1)
      w.push({ level: "info", message: `Mirror glaze works best on the top tier; tier ${i + 1} will be glazed before stacking.` });
  });

  const layout = computeTierLayout(config);
  layout.forEach((tier, i) => {
    const decos = config.decorations.filter((d) => d.tierIndex === i && d.surface === "top");
    const area = tier.width * tier.depth * 0.75;
    const used = decos.reduce((s, d) => {
      const def = getDecoration(d.decorationId);
      const r = (def?.radius ?? 0) * SIZE_FACTOR[d.size] * d.scale;
      return s + Math.PI * r * r;
    }, 0);
    if (used > area * 0.85) w.push({ level: "error", message: `Tier ${i + 1} top is overcrowded — remove or shrink some decorations.` });
    else if (used > area * 0.6) w.push({ level: "info", message: `Tier ${i + 1} top is getting busy; consider spacing decorations.` });
  });

  if (config.decorations.some((d) => getDecoration(d.decorationId)?.requiresApproval))
    w.push({ level: "approval", message: "Custom figurine requests are reviewed by our artists (24–48h)." });
  if (config.photo.dataUrl && config.tiers[n - 1].frosting === "naked")
    w.push({ level: "info", message: "Edible photos print best on smooth frosting such as fondant or buttercream." });

  return w;
}

export const needsApproval = (config: CakeConfig) => validateDesign(config).some((w) => w.level === "approval");
export const hasBlockingErrors = (config: CakeConfig) => validateDesign(config).some((w) => w.level === "error");

/**
 * Collision check for a single decoration placement (normalized coordinates).
 * Returns other decorations overlapping the candidate.
 */
export function findCollisions(config: CakeConfig, candidate: PlacedDecoration): PlacedDecoration[] {
  const layout = computeTierLayout(config)[candidate.tierIndex];
  if (!layout) return [];
  const def = getDecoration(candidate.decorationId);
  if (!def || def.placement === "scatter") return [];
  const r1 = def.radius * SIZE_FACTOR[candidate.size] * candidate.scale;
  return config.decorations.filter((o) => {
    if (o.uid === candidate.uid || o.tierIndex !== candidate.tierIndex || o.surface !== candidate.surface) return false;
    const od = getDecoration(o.decorationId);
    if (!od || od.placement === "scatter") return false;
    const r2 = od.radius * SIZE_FACTOR[o.size] * o.scale;
    let dist: number;
    if (candidate.surface === "top") {
      const dx = (candidate.u - o.u) * layout.width * 0.5;
      const dz = (candidate.v - o.v) * layout.depth * 0.5;
      dist = Math.hypot(dx, dz);
    } else {
      const R = (layout.width + layout.depth) / 4;
      let da = Math.abs(candidate.u - o.u) % (Math.PI * 2);
      if (da > Math.PI) da = Math.PI * 2 - da;
      dist = Math.hypot(da * R, (candidate.v - o.v) * layout.height);
    }
    return dist < (r1 + r2) * 0.55;
  });
}
