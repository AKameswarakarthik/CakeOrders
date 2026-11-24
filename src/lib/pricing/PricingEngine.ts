import type { CakeConfig, PriceBreakdown, PriceLine } from "@/types/cake";
import { COUPONS, PRICING, type Coupon } from "@/data/pricing";
import { FLAVORS, FROSTINGS, FILLINGS } from "@/data/catalog";
import { getDecoration } from "@/data/decorations";
import { computeTierLayout } from "@/lib/cake/dimensions";

export type DeliveryMode = "standard" | "express" | "midnight" | "pickup";

export interface PriceOptions {
  delivery?: DeliveryMode | null; // null → exclude delivery (design-time view)
  coupon?: string | null;
  /** multiply the cake portion (cart quantity) */
  quantity?: number;
}

/** Price of just the cake (no delivery / tax / discount). */
export function cakeLines(config: CakeConfig): PriceLine[] {
  const P = PRICING;
  const lines: PriceLine[] = [];
  const W = config.weightKg;
  const layout = computeTierLayout(config);

  lines.push({ label: `Base cake (${W} kg)`, amount: P.basePerKg * W, detail: `₹${P.basePerKg}/kg` });

  const shapeFee = P.shapeSurcharge[config.shape];
  if (shapeFee) lines.push({ label: `${config.shape[0].toUpperCase()}${config.shape.slice(1)} shape`, amount: shapeFee });

  if (config.eggless) lines.push({ label: "Eggless preparation", amount: P.egglessPerKg * W });

  if (config.tiers.length > 1)
    lines.push({ label: `Additional tiers ×${config.tiers.length - 1}`, amount: P.additionalTier * (config.tiers.length - 1), detail: "Dowels & structural support" });

  config.tiers.forEach((t, i) => {
    const kg = W * (layout[i]?.weightShare ?? 1 / config.tiers.length);
    const fl = P.flavorPerKg[t.flavor] * kg;
    const tierLabel = config.tiers.length > 1 ? ` · tier ${i + 1}` : "";
    if (fl > 0) lines.push({ label: `${FLAVORS.find((f) => f.id === t.flavor)?.name} flavour${tierLabel}`, amount: fl });
    const fr = P.frostingPerKg[t.frosting] * kg;
    if (fr > 0) lines.push({ label: `${FROSTINGS.find((f) => f.id === t.frosting)?.name}${tierLabel}`, amount: fr });
    const cm = P.colorMode[t.colorMode];
    if (cm > 0) lines.push({ label: `${t.colorMode} finish${tierLabel}`, amount: cm });
  });

  // decorations grouped by type
  const groups = new Map<string, { qty: number; amount: number }>();
  for (const d of config.decorations) {
    const def = getDecoration(d.decorationId);
    if (!def) continue;
    const amt = def.price * (P.sizeFactor[d.size] ?? 1);
    const g = groups.get(def.id) ?? { qty: 0, amount: 0 };
    g.qty += 1;
    g.amount += amt;
    groups.set(def.id, g);
  }
  groups.forEach((g, id) => {
    const def = getDecoration(id)!;
    lines.push({ label: `${def.name} ×${g.qty}`, amount: g.amount, detail: def.edible ? "Edible" : "Non-edible keepsake" });
  });

  const m = config.message;
  if (m.text.trim()) {
    let amt = P.message.base + P.message[m.material];
    if (m.position === "plaque") amt += P.message.plaque;
    if (m.curved) amt += P.message.curved;
    if (amt > 0) lines.push({ label: "Personalised message", amount: amt, detail: `${m.material} lettering` });
  }

  if (config.photo.dataUrl) lines.push({ label: "Edible photo print", amount: P.photoPrint });

  const e = config.extras;
  if (P.drip[e.dripStyle]) lines.push({ label: `${e.dripStyle} drip`, amount: P.drip[e.dripStyle] });
  const filling = FILLINGS.find((f) => f.id === e.filling);
  if (filling?.price) lines.push({ label: `${filling.name} filling`, amount: filling.price * Math.max(1, Math.round(W)) });
  if (e.extraCream) lines.push({ label: "Extra cream", amount: P.extraCream });
  if (e.chocolateCoating) lines.push({ label: "Chocolate coating", amount: P.chocolateCoating });
  if (P.border[e.border]) lines.push({ label: `${e.border} border`, amount: P.border[e.border] });
  if (P.basePlate[e.basePlate]) lines.push({ label: `${e.basePlate} base`, amount: P.basePlate[e.basePlate] });
  if (P.packaging[e.packaging]) lines.push({ label: `${e.packaging} packaging`, amount: P.packaging[e.packaging] });
  if (e.giftMessage.trim()) lines.push({ label: "Gift card message", amount: P.giftMessage });

  return lines.map((l) => ({ ...l, amount: Math.round(l.amount) }));
}

export const cakeSubtotal = (config: CakeConfig) => cakeLines(config).reduce((s, l) => s + l.amount, 0);

export function findCoupon(code?: string | null): Coupon | undefined {
  if (!code) return undefined;
  return COUPONS.find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
}

export interface CouponResult {
  ok: boolean;
  message: string;
  discount: number;
  freeMidnight?: boolean;
}

export function evaluateCoupon(code: string | null | undefined, subtotal: number): CouponResult {
  if (!code) return { ok: false, message: "", discount: 0 };
  const c = findCoupon(code);
  if (!c) return { ok: false, message: "Invalid coupon code", discount: 0 };
  if (c.minOrder && subtotal < c.minOrder)
    return { ok: false, message: `Add ₹${c.minOrder - subtotal} more to use ${c.code}`, discount: 0 };
  if (c.type === "percent") {
    const raw = (subtotal * c.value) / 100;
    const discount = Math.round(Math.min(raw, c.maxDiscount ?? Infinity));
    return { ok: true, message: c.description, discount };
  }
  if (c.type === "flat") return { ok: true, message: c.description, discount: c.value };
  return { ok: true, message: c.description, discount: 0, freeMidnight: true };
}

export function deliveryFee(mode: DeliveryMode, subtotal: number, freeMidnight = false) {
  const D = PRICING.delivery;
  switch (mode) {
    case "pickup":
      return 0;
    case "midnight":
      return freeMidnight ? 0 : D.midnight;
    case "express":
      return D.express;
    default:
      return subtotal >= D.freeAbove ? 0 : D.standard;
  }
}

/** Full breakdown for a list of cart items (or a single design). */
export function priceOrder(items: { config: CakeConfig; quantity: number }[], opts: PriceOptions = {}): PriceBreakdown {
  const lines: PriceLine[] = [];
  let subtotal = 0;
  for (const it of items) {
    const s = cakeSubtotal(it.config) * it.quantity;
    subtotal += s;
    lines.push({ label: `${it.config.name}${it.quantity > 1 ? ` ×${it.quantity}` : ""}`, amount: s });
  }
  const coupon = evaluateCoupon(opts.coupon, subtotal);
  const delivery = opts.delivery ? deliveryFee(opts.delivery, subtotal, coupon.freeMidnight) : 0;
  const discount = coupon.ok ? Math.min(coupon.discount, subtotal) : 0;
  const tax = Math.round((subtotal - discount) * PRICING.gstRate);
  return {
    lines,
    subtotal,
    delivery,
    discount,
    discountLabel: coupon.ok ? coupon.message : undefined,
    tax,
    total: subtotal - discount + tax + delivery,
  };
}

/** Breakdown for one design (studio sidebar). */
export function priceDesign(config: CakeConfig, opts: PriceOptions = {}): PriceBreakdown {
  const lines = cakeLines(config);
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const coupon = evaluateCoupon(opts.coupon, subtotal);
  const discount = coupon.ok ? coupon.discount : 0;
  const delivery = opts.delivery ? deliveryFee(opts.delivery, subtotal, coupon.freeMidnight) : 0;
  const tax = Math.round((subtotal - discount) * PRICING.gstRate);
  return { lines, subtotal, delivery, discount, discountLabel: coupon.ok ? coupon.message : undefined, tax, total: subtotal - discount + tax + delivery };
}
