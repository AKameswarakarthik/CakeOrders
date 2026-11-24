import type { CakeConfig, OccasionId } from "@/types/cake";
import { createDecoration, createDefaultConfig, createTier, ringOf } from "@/lib/cake/defaults";

export interface CakeTemplate {
  id: string;
  name: string;
  occasion: OccasionId;
  description: string;
  badge?: string;
  rating: number;
  build: () => CakeConfig;
}

const make = (occasion: OccasionId, patch: (c: CakeConfig) => void): CakeConfig => {
  const c = createDefaultConfig(occasion);
  patch(c);
  return c;
};

export const TEMPLATES: CakeTemplate[] = [
  {
    id: "rose-gold-romance",
    name: "Rose Gold Romance",
    occasion: "anniversary",
    description: "Two-tier heart with chocolate roses and a romantic couple.",
    badge: "Bestseller",
    rating: 4.9,
    build: () =>
      make("anniversary", (c) => {
        c.name = "Rose Gold Romance";
        c.shape = "heart";
        c.weightKg = 2;
        c.tiers = [
          createTier({ flavor: "red-velvet", frosting: "buttercream", colors: ["#f4c7c3", "#b76e79"] }),
          createTier({ flavor: "red-velvet", frosting: "buttercream", colorMode: "gold", colors: ["#d4af37", "#d4af37"] }),
        ];
        c.decorations = [
          ...ringOf("choc-roses", 6, { tierIndex: 0, radius: 0.82, color: "#7a1022" }),
          createDecoration("romantic-couple", { tierIndex: 1, pendingSnap: true }),
          ...ringOf("choc-stars", 5, { tierIndex: 0, surface: "side", color: "#d4af37", height: 0.55 }),
        ];
        c.message = { ...c.message, text: "Happy Anniversary", position: "side-front", font: "script", color: "#7a1022" };
        c.extras.dripStyle = "none";
        c.extras.border = "pearl";
      }),
  },
  {
    id: "midnight-truffle",
    name: "Midnight Truffle Drip",
    occasion: "birthday",
    description: "Belgian chocolate with a dark ganache drip, gold leaf and balls.",
    badge: "Trending",
    rating: 4.8,
    build: () =>
      make("birthday", (c) => {
        c.name = "Midnight Truffle Drip";
        c.weightKg = 1.5;
        c.tiers = [createTier({ flavor: "belgian-chocolate", frosting: "ganache", colors: ["#3b2218", "#5c3a28"] })];
        c.extras.dripStyle = "gold";
        c.decorations = [
          ...ringOf("choc-balls", 7, { radius: 0.7, color: "#d4af37" }),
          createDecoration("gold-leaf", { pendingSnap: true, u: 0.1, v: -0.1 }),
          ...ringOf("birthday-candles", 5, { radius: 0.35, color: "#f6d55c", phase: 0.3 }),
        ];
        c.message = { ...c.message, text: "Happy Birthday", color: "#d4af37", position: "top-front" };
      }),
  },
  {
    id: "royal-wedding",
    name: "Royal Ivory Wedding",
    occasion: "wedding",
    description: "Three fondant tiers with white roses, pearls and bride & groom.",
    badge: "Premium",
    rating: 5,
    build: () =>
      make("wedding", (c) => {
        c.name = "Royal Ivory Wedding";
        c.shape = "multi-tier";
        c.weightKg = 5;
        c.tiers = [0, 1, 2].map(() => createTier({ flavor: "vanilla", frosting: "fondant", colors: ["#fffaf0", "#f5ecd7"] }));
        c.decorations = [
          createDecoration("bride-groom", { tierIndex: 2, pendingSnap: true }),
          ...ringOf("white-roses", 6, { tierIndex: 0, radius: 0.86 }),
          ...ringOf("golden-pearls", 6, { tierIndex: 1, surface: "side", height: 0.4 }),
          ...ringOf("fondant-flowers", 5, { tierIndex: 1, radius: 0.85, color: "#f8d0d8" }),
        ];
        c.message = { ...c.message, text: "", position: "top-front" };
        c.extras.border = "pearl";
        c.extras.basePlate = "marble";
        c.extras.packaging = "luxury";
      }),
  },
  {
    id: "sweet-sixteen",
    name: "Sweet 16 Number Cake",
    occasion: "birthday",
    description: "Number-shaped strawberry cake with macaron-pink cream & sprinkles.",
    rating: 4.7,
    build: () =>
      make("birthday", (c) => {
        c.name = "Sweet 16 Number Cake";
        c.shape = "number";
        c.shapeText = "16";
        c.weightKg = 2;
        c.tiers = [createTier({ flavor: "strawberry", frosting: "whipped-cream", colors: ["#fbd1e0", "#f4a6c1"] })];
        c.decorations = [createDecoration("sprinkles", { color: "#f4a6c1" }), ...ringOf("strawberries", 4, { radius: 0.4 })];
        c.message = { ...c.message, text: "" };
        c.extras.border = "none";
      }),
  },
  {
    id: "mirror-galaxy",
    name: "Mirror Glaze Galaxy",
    occasion: "congratulations",
    description: "A glossy dome in ombré violet with edible diamonds.",
    badge: "New",
    rating: 4.8,
    build: () =>
      make("congratulations", (c) => {
        c.name = "Mirror Glaze Galaxy";
        c.shape = "dome";
        c.weightKg = 1;
        c.tiers = [createTier({ flavor: "blueberry", frosting: "mirror-glaze", colorMode: "ombre", colors: ["#1e2a5a", "#cdb4f0"] })];
        c.decorations = [...ringOf("edible-diamonds", 6, { radius: 0.45, color: "#e6f7ff" }), createDecoration("edible-glitter", { color: "#c0c0c0" })];
        c.message = { ...c.message, text: "" };
        c.extras.border = "none";
        c.extras.basePlate = "glass";
      }),
  },
  {
    id: "engagement-blush",
    name: "Blush Engagement",
    occasion: "engagement",
    description: "Two-tier blush ombré with chocolate ring and couple.",
    rating: 4.9,
    build: () =>
      make("engagement", (c) => {
        c.name = "Blush Engagement";
        c.weightKg = 3;
        c.tiers = [
          createTier({ flavor: "white-forest", frosting: "buttercream", colorMode: "ombre", colors: ["#f8d0d8", "#fffaf0"] }),
          createTier({ flavor: "white-forest", frosting: "buttercream", colors: ["#fffaf0", "#f8d0d8"] }),
        ];
        c.decorations = [
          createDecoration("engagement-couple", { tierIndex: 1, pendingSnap: true, u: -0.2 }),
          createDecoration("choc-ring", { tierIndex: 1, pendingSnap: true, u: 0.45, v: 0.3 }),
          ...ringOf("white-choc-roses", 5, { tierIndex: 0, radius: 0.85 }),
          ...ringOf("silver-pearls", 8, { tierIndex: 0, surface: "side", height: 0.7 }),
        ];
        c.message = { ...c.message, text: "Forever Starts Now", position: "side-front", color: "#b76e79" };
      }),
  },
  {
    id: "baby-cloud",
    name: "Little Cloud Baby Shower",
    occasion: "baby-shower",
    description: "Baby-blue square with teddy, rainbow arch & stars.",
    rating: 4.8,
    build: () =>
      make("baby-shower", (c) => {
        c.name = "Little Cloud";
        c.shape = "square";
        c.weightKg = 1.5;
        c.tiers = [createTier({ flavor: "vanilla", frosting: "whipped-cream", colorMode: "two-tone", colors: ["#bfe3fa", "#ffffff"] })];
        c.decorations = [
          createDecoration("teddy-bear", { pendingSnap: true, u: -0.3, v: 0.1, color: "#c69c72" }),
          createDecoration("rainbow-deco", { pendingSnap: true, u: 0.3, v: -0.2 }),
          ...ringOf("choc-stars", 6, { radius: 0.82, color: "#f6d55c" }),
        ];
        c.message = { ...c.message, text: "Welcome Baby", color: "#3c6fd8", font: "playful" };
      }),
  },
  {
    id: "fruit-garden",
    name: "Fresh Fruit Garden",
    occasion: "custom",
    description: "Semi-naked pineapple cake crowned with fresh fruits.",
    rating: 4.6,
    build: () =>
      make("custom", (c) => {
        c.name = "Fresh Fruit Garden";
        c.weightKg = 1.5;
        c.tiers = [createTier({ flavor: "pineapple", frosting: "semi-naked", colors: ["#fffaf3", "#f5e6d3"] })];
        c.decorations = [
          createDecoration("mixed-fruits", { pendingSnap: true }),
          ...ringOf("strawberries", 6, { radius: 0.75 }),
          ...ringOf("blueberries", 6, { radius: 0.55, phase: 0.5 }),
          ...ringOf("choc-leaves", 4, { radius: 0.35, phase: 0.2, color: "#4caf7a" }),
        ];
        c.message = { ...c.message, text: "" };
        c.extras.border = "none";
        c.extras.basePlate = "wood";
      }),
  },
  {
    id: "valentine-heart",
    name: "Ruby Valentine Heart",
    occasion: "valentine",
    description: "Red velvet heart with velvet finish, hearts and gold leaf.",
    rating: 4.9,
    build: () =>
      make("valentine", (c) => {
        c.name = "Ruby Valentine Heart";
        c.shape = "heart";
        c.weightKg = 1;
        c.tiers = [createTier({ flavor: "red-velvet", frosting: "velvet", colors: ["#c8102e", "#9b1b30"] })];
        c.decorations = [...ringOf("choc-hearts", 6, { radius: 0.6, color: "#f4a6c1" }), createDecoration("red-roses", { pendingSnap: true, u: 0.25, v: 0.2 })];
        c.message = { ...c.message, text: "Be Mine", color: "#fffaf3", font: "script" };
      }),
  },
  {
    id: "corporate-onyx",
    name: "Onyx Corporate",
    occasion: "corporate",
    description: "Sleek rectangle in black fondant with silver leaf & shards.",
    rating: 4.7,
    build: () =>
      make("corporate", (c) => {
        c.name = "Onyx Corporate";
        c.shape = "rectangle";
        c.weightKg = 3;
        c.tiers = [createTier({ flavor: "coffee", frosting: "fondant", colors: ["#1b1b1b", "#3b3b3b"] })];
        c.decorations = [
          createDecoration("personal-topper", { pendingSnap: true, label: "Q4 Wins", color: "#c0c0c0" }),
          ...ringOf("choc-shards", 4, { radius: 0.7, color: "#f3e6d0" }),
          createDecoration("silver-leaf", { pendingSnap: true, u: 0.5, v: 0.4 }),
        ];
        c.message = { ...c.message, text: "Cheers to the Team", color: "#c0c0c0", font: "modern", position: "side-front" };
        c.extras.basePlate = "silver";
      }),
  },
  {
    id: "graduation-gold",
    name: "Gold Graduate",
    occasion: "graduation",
    description: "Navy & gold two-tone with crown topper and confetti.",
    rating: 4.6,
    build: () =>
      make("graduation", (c) => {
        c.name = "Gold Graduate";
        c.shape = "hexagon";
        c.weightKg = 2;
        c.tiers = [createTier({ flavor: "butterscotch", frosting: "buttercream", colorMode: "two-tone", colors: ["#1e2a5a", "#d4af37"] })];
        c.decorations = [createDecoration("crown-topper", { pendingSnap: true }), createDecoration("confetti", { color: "#d4af37" })];
        c.message = { ...c.message, text: "Congrats Grad!", color: "#d4af37", position: "side-front", font: "elegant" };
      }),
  },
];

export const getTemplate = (id: string) => TEMPLATES.find((t) => t.id === id);
