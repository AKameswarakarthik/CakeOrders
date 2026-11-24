/**
 * Configurable mock pricing. All amounts in INR (₹).
 * UI components never hardcode prices — they read from here via the PricingEngine.
 */
import type { BasePlate, BorderStyle, ColorMode, DripStyle, FlavorId, FrostingId, Packaging, ShapeId } from "@/types/cake";

export const PRICING = {
  basePerKg: 699,
  egglessPerKg: 60,
  shapeSurcharge: {
    round: 0,
    square: 50,
    rectangle: 50,
    heart: 150,
    hexagon: 150,
    oval: 100,
    number: 350,
    letter: 350,
    dome: 300,
    "multi-tier": 0,
  } satisfies Record<ShapeId, number>,
  /** per kg, applied pro-rata per tier weight */
  flavorPerKg: {
    chocolate: 0,
    vanilla: 0,
    "black-forest": 50,
    "white-forest": 80,
    "red-velvet": 220,
    butterscotch: 50,
    strawberry: 80,
    pineapple: 0,
    blueberry: 250,
    "belgian-chocolate": 320,
    "chocolate-truffle": 200,
    coffee: 120,
    rasmalai: 300,
    kitkat: 260,
    custom: 350,
  } satisfies Record<FlavorId, number>,
  frostingPerKg: {
    buttercream: 0,
    "whipped-cream": 0,
    ganache: 150,
    fondant: 420,
    "cream-cheese": 200,
    "mirror-glaze": 380,
    naked: 0,
    "semi-naked": 50,
    velvet: 300,
    "chocolate-drip": 140,
  } satisfies Record<FrostingId, number>,
  /** flat per tier */
  colorMode: {
    solid: 0,
    "two-tone": 99,
    ombre: 199,
    rainbow: 249,
    gold: 399,
    silver: 349,
  } satisfies Record<ColorMode, number>,
  additionalTier: 449,
  message: { base: 0, chocolate: 79, fondant: 99, icing: 0, plaque: 149, curved: 49 },
  photoPrint: 349,
  drip: { none: 0, dark: 199, white: 199, gold: 299, caramel: 219, pink: 219 } satisfies Record<DripStyle, number>,
  extraCream: 99,
  chocolateCoating: 149,
  border: { none: 0, pearl: 149, shell: 99, rosette: 149, rope: 99 } satisfies Record<BorderStyle, number>,
  basePlate: { gold: 0, silver: 0, marble: 299, wood: 199, glass: 349 } satisfies Record<BasePlate, number>,
  packaging: { standard: 0, premium: 199, luxury: 549 } satisfies Record<Packaging, number>,
  giftMessage: 49,
  delivery: {
    standard: 79,
    freeAbove: 1499,
    midnight: 249,
    express: 149,
    pickup: 0,
  },
  gstRate: 0.05,
  sizeFactor: { S: 0.8, M: 1, L: 1.35 },
} as const;

export interface Coupon {
  code: string;
  description: string;
  type: "percent" | "flat" | "free-midnight";
  value: number;
  maxDiscount?: number;
  minOrder?: number;
}

export const COUPONS: Coupon[] = [
  { code: "SWEET10", description: "10% off (up to ₹300)", type: "percent", value: 10, maxDiscount: 300 },
  { code: "FIRSTCAKE", description: "₹150 off on orders above ₹999", type: "flat", value: 150, minOrder: 999 },
  { code: "LOVE20", description: "20% off above ₹2,499 (up to ₹600)", type: "percent", value: 20, maxDiscount: 600, minOrder: 2499 },
  { code: "MIDNIGHT", description: "Free midnight delivery", type: "free-midnight", value: 0 },
];

export const DELIVERY_SLOTS = [
  "09:00 – 12:00",
  "12:00 – 15:00",
  "15:00 – 18:00",
  "18:00 – 21:00",
  "23:30 – 00:30 (Midnight)",
];

/** serviceable PIN code prefixes for the mock delivery checker */
export const SERVICEABLE_PIN_PREFIXES = ["50", "40", "11", "56", "60", "70", "52", "53"];
