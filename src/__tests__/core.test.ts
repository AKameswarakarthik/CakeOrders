import { describe, expect, it } from "vitest";
import { createDefaultConfig, createDecoration, createTier, ringOf } from "@/lib/cake/defaults";
import { cakeSubtotal, evaluateCoupon, priceDesign, priceOrder, deliveryFee } from "@/lib/pricing/PricingEngine";
import { PRICING } from "@/data/pricing";
import { parsePrompt, optimize, surprise, colorHarmonies } from "@/lib/ai/AIDesignService";
import { validateDesign, findCollisions } from "@/lib/cake/validation";
import { computeTierLayout } from "@/lib/cake/dimensions";
import { decodeDesign, encodeDesign } from "@/lib/services/share";
import { TEMPLATES } from "@/data/templates";
import { DECORATIONS } from "@/data/decorations";
import { OCCASIONS } from "@/data/occasions";

describe("pricing engine", () => {
  it("prices a default 1 kg cake from config, not hardcoded values", () => {
    const c = createDefaultConfig("birthday");
    c.extras.packaging = "standard";
    c.extras.border = "none";
    c.message.text = "";
    expect(cakeSubtotal(c)).toBe(PRICING.basePerKg);
  });

  it("scales with weight, flavour, tiers and decorations", () => {
    const c = createDefaultConfig("birthday");
    const base = cakeSubtotal(c);
    c.weightKg = 2;
    expect(cakeSubtotal(c)).toBeGreaterThan(base);
    const w2 = cakeSubtotal(c);
    c.tiers = [createTier({ flavor: "belgian-chocolate" }), createTier({ flavor: "belgian-chocolate" })];
    expect(cakeSubtotal(c)).toBeGreaterThan(w2 + PRICING.additionalTier);
    const t2 = cakeSubtotal(c);
    c.decorations = ringOf("choc-roses", 4);
    expect(cakeSubtotal(c)).toBe(t2 + 4 * 89);
  });

  it("applies coupons, GST and delivery", () => {
    const c = createDefaultConfig("birthday");
    c.weightKg = 3;
    const p = priceDesign(c, { coupon: "SWEET10", delivery: "standard" });
    expect(p.discount).toBe(Math.min(300, Math.round(p.subtotal * 0.1)));
    expect(p.tax).toBe(Math.round((p.subtotal - p.discount) * PRICING.gstRate));
    expect(p.delivery).toBe(0); // above free threshold
    expect(p.total).toBe(p.subtotal - p.discount + p.tax);
    expect(evaluateCoupon("NOPE", 1000).ok).toBe(false);
    expect(evaluateCoupon("FIRSTCAKE", 500).ok).toBe(false);
    expect(evaluateCoupon("MIDNIGHT", 500).freeMidnight).toBe(true);
    expect(deliveryFee("midnight", 500, true)).toBe(0);
    expect(deliveryFee("standard", 500)).toBe(PRICING.delivery.standard);
  });

  it("totals multiple cart items with quantities", () => {
    const a = createDefaultConfig("birthday");
    const b = createDefaultConfig("wedding");
    const o = priceOrder([{ config: a, quantity: 2 }, { config: b, quantity: 1 }], { delivery: "pickup" });
    expect(o.subtotal).toBe(cakeSubtotal(a) * 2 + cakeSubtotal(b));
    expect(o.delivery).toBe(0);
  });
});

describe("AI rule-based parser", () => {
  it("parses the spec example prompt", () => {
    const r = parsePrompt(
      "I want a two-tier heart-shaped chocolate anniversary cake with red chocolate roses, a romantic couple figurine, golden stars, and Happy Anniversary written on the top."
    );
    const c = r.config;
    expect(c.occasion).toBe("anniversary");
    expect(c.tiers).toHaveLength(2);
    expect(c.shape).toBe("heart");
    expect(c.tiers[0].flavor).toBe("chocolate");
    const ids = new Set(c.decorations.map((d) => d.decorationId));
    expect(ids.has("choc-roses")).toBe(true);
    expect(ids.has("romantic-couple")).toBe(true);
    expect(ids.has("choc-stars")).toBe(true);
    expect(c.decorations.find((d) => d.decorationId === "choc-roses")!.color).toBe("#c8102e");
    expect(c.message.text).toMatch(/Happy Anniversary/);
    expect(c.weightKg).toBeGreaterThanOrEqual(2);
  });

  it("handles number cakes, quantities, weights and eggless", () => {
    const c = parsePrompt("eggless number 18 birthday cake 2kg with 12 strawberries and sprinkles").config;
    expect(c.shape).toBe("number");
    expect(c.shapeText).toBe("18");
    expect(c.eggless).toBe(true);
    expect(c.weightKg).toBe(2);
    expect(c.decorations.filter((d) => d.decorationId === "strawberries")).toHaveLength(12);
    expect(c.decorations.some((d) => d.decorationId === "sprinkles")).toBe(true);
  });

  it("optimizes a design to fit a budget", () => {
    const c = TEMPLATES.find((t) => t.id === "royal-wedding")!.build();
    const before = cakeSubtotal(c);
    const r = optimize(c, 3000);
    expect(cakeSubtotal(r.config)).toBeLessThan(before);
  });

  it("surprise designs are always structurally valid", () => {
    for (let i = 0; i < 30; i++) {
      const c = surprise().config;
      expect(validateDesign(c).filter((w) => w.level === "error")).toEqual([]);
    }
  });

  it("generates colour harmonies as valid hex", () => {
    colorHarmonies("#b76e79").forEach((h) => h.colors.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/i)));
  });
});

describe("validation & layout", () => {
  it("flags under-weight tiers and approval items", () => {
    const c = createDefaultConfig("wedding");
    c.tiers = [createTier(), createTier(), createTier(), createTier()];
    c.weightKg = 2;
    const w = validateDesign(c);
    expect(w.some((x) => x.level === "error")).toBe(true);
    expect(w.some((x) => x.level === "approval")).toBe(true);
  });

  it("detects colliding decorations", () => {
    const c = createDefaultConfig("birthday");
    const a = createDecoration("choc-roses", { u: 0.2, v: 0.2 });
    c.decorations = [a];
    expect(findCollisions(c, createDecoration("choc-roses", { u: 0.21, v: 0.2 }))).toHaveLength(1);
    expect(findCollisions(c, createDecoration("choc-roses", { u: -0.6, v: -0.4 }))).toHaveLength(0);
  });

  it("stacks tiers and grows with weight", () => {
    const c = createDefaultConfig("birthday");
    const small = computeTierLayout(c)[0].width;
    c.weightKg = 5;
    expect(computeTierLayout(c)[0].width).toBeGreaterThan(small);
    c.tiers = [createTier(), createTier(), createTier()];
    const l = computeTierLayout(c);
    expect(l[1].y).toBeCloseTo(l[0].y + l[0].height);
    expect(l[2].width).toBeLessThan(l[1].width);
  });

  it("all templates build without blocking errors", () => {
    TEMPLATES.forEach((t) => expect(validateDesign(t.build()).filter((w) => w.level === "error")).toEqual([]));
  });
});

describe("catalog integrity & sharing", () => {
  it("occasion recommendations reference real decorations", () => {
    const ids = new Set(DECORATIONS.map((d) => d.id));
    OCCASIONS.forEach((o) => o.recommendedDecorations.forEach((id) => expect(ids.has(id), `${o.id} → ${id}`).toBe(true)));
  });

  it("round-trips a design through a share link", () => {
    const c = TEMPLATES[0].build();
    c.message.text = "जन्मदिन मुबारक · పుట్టినరోజు";
    const back = decodeDesign(encodeDesign(c))!;
    expect(back.message.text).toBe(c.message.text);
    expect(back.decorations).toHaveLength(c.decorations.length);
    expect(decodeDesign("garbage")).toBeNull();
  });
});
