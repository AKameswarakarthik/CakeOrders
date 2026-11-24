import type { ColorMode, FlavorId, FrostingId, ShapeId } from "@/types/cake";

export interface ShapeOption {
  id: ShapeId;
  name: string;
  description: string;
  maxTiers: number;
  minTiers?: number;
}

export const SHAPES: ShapeOption[] = [
  { id: "round", name: "Round", description: "Timeless classic", maxTiers: 5 },
  { id: "square", name: "Square", description: "Clean modern lines", maxTiers: 5 },
  { id: "rectangle", name: "Rectangle", description: "Sheet-style party cake", maxTiers: 3 },
  { id: "heart", name: "Heart", description: "Made for romance", maxTiers: 3 },
  { id: "hexagon", name: "Hexagon", description: "Geometric luxe", maxTiers: 4 },
  { id: "oval", name: "Oval", description: "Soft & elegant", maxTiers: 3 },
  { id: "number", name: "Number", description: "Any age or date", maxTiers: 1 },
  { id: "letter", name: "Letter", description: "Initials & monograms", maxTiers: 1 },
  { id: "dome", name: "Dome", description: "Mirror-glaze showpiece", maxTiers: 1 },
  { id: "multi-tier", name: "Multi-tier", description: "Grand celebrations", maxTiers: 5, minTiers: 2 },
];

export interface WeightOption {
  kg: number;
  label: string;
}

export const WEIGHTS: WeightOption[] = [
  { kg: 0.5, label: "0.5 kg" },
  { kg: 1, label: "1 kg" },
  { kg: 1.5, label: "1.5 kg" },
  { kg: 2, label: "2 kg" },
  { kg: 3, label: "3 kg" },
  { kg: 5, label: "5 kg" },
];

export const MIN_WEIGHT_FOR_TIERS: Record<number, number> = { 1: 0.5, 2: 2, 3: 3, 4: 5, 5: 7 };
export const MAX_CUSTOM_WEIGHT = 20;
export const SERVINGS_PER_KG = 8;

export interface FlavorOption {
  id: FlavorId;
  name: string;
  sponge: string; // sponge colour used for naked cakes
  cream: string; // filling cream colour
  note: string;
  premium?: boolean;
}

export const FLAVORS: FlavorOption[] = [
  { id: "chocolate", name: "Chocolate", sponge: "#4a2a1c", cream: "#6b3f2a", note: "Rich cocoa sponge" },
  { id: "vanilla", name: "Vanilla", sponge: "#f1d9a6", cream: "#fff6e6", note: "Madagascar vanilla bean" },
  { id: "black-forest", name: "Black Forest", sponge: "#3b2219", cream: "#fff3ea", note: "Cherries & chocolate shavings" },
  { id: "white-forest", name: "White Forest", sponge: "#f3e2c0", cream: "#fffaf0", note: "White chocolate & cherries" },
  { id: "red-velvet", name: "Red Velvet", sponge: "#9b1b2b", cream: "#fff5ee", note: "Cream-cheese layered", premium: true },
  { id: "butterscotch", name: "Butterscotch", sponge: "#e2b36b", cream: "#f6dca8", note: "Caramel praline crunch" },
  { id: "strawberry", name: "Strawberry", sponge: "#f4b8c2", cream: "#ffe3ea", note: "Fresh strawberry compote" },
  { id: "pineapple", name: "Pineapple", sponge: "#f5dc8a", cream: "#fff8de", note: "Tropical pineapple chunks" },
  { id: "blueberry", name: "Blueberry", sponge: "#c9b8e6", cream: "#ece4fb", note: "Wild blueberry swirl", premium: true },
  { id: "belgian-chocolate", name: "Belgian Chocolate", sponge: "#33190f", cream: "#4f2a1a", note: "54% Callebaut couverture", premium: true },
  { id: "chocolate-truffle", name: "Chocolate Truffle", sponge: "#3a1d12", cream: "#5a3020", note: "Silky truffle ganache", premium: true },
  { id: "coffee", name: "Coffee", sponge: "#7a5236", cream: "#d8b892", note: "Espresso mocha layers" },
  { id: "rasmalai", name: "Rasmalai", sponge: "#f6e3b0", cream: "#fff2cc", note: "Saffron, pistachio & cardamom", premium: true },
  { id: "kitkat", name: "KitKat", sponge: "#4a2a1c", cream: "#c8955f", note: "Wafer crunch fusion", premium: true },
  { id: "custom", name: "Custom Flavour", sponge: "#e8cfa8", cream: "#fff3df", note: "Tell our chefs your idea" },
];

export interface FrostingOption {
  id: FrostingId;
  name: string;
  note: string;
  firm: boolean; // can support heavy decorations
}

export const FROSTINGS: FrostingOption[] = [
  { id: "buttercream", name: "Buttercream", note: "Smooth & creamy", firm: true },
  { id: "whipped-cream", name: "Whipped Cream", note: "Light & airy", firm: false },
  { id: "ganache", name: "Chocolate Ganache", note: "Glossy & decadent", firm: true },
  { id: "fondant", name: "Fondant", note: "Sculpted perfection", firm: true },
  { id: "cream-cheese", name: "Cream Cheese", note: "Tangy & velvety", firm: true },
  { id: "mirror-glaze", name: "Mirror Glaze", note: "Reflective shine", firm: false },
  { id: "naked", name: "Naked", note: "Rustic exposed layers", firm: true },
  { id: "semi-naked", name: "Semi-naked", note: "Scraped boho finish", firm: true },
  { id: "velvet", name: "Velvet Finish", note: "Suede-like spray", firm: true },
  { id: "chocolate-drip", name: "Chocolate Drip", note: "Ganache drip finish", firm: true },
];

export const COLOR_MODES: { id: ColorMode; name: string }[] = [
  { id: "solid", name: "Single colour" },
  { id: "two-tone", name: "Two-tone" },
  { id: "ombre", name: "Ombré" },
  { id: "rainbow", name: "Rainbow" },
  { id: "gold", name: "Metallic gold" },
  { id: "silver", name: "Metallic silver" },
];

export interface Palette {
  name: string;
  colors: string[];
}

export const PALETTES: Palette[] = [
  { name: "Rose Gold", colors: ["#f4c7c3", "#e8a598", "#b76e79", "#fbe3d6", "#d4a373"] },
  { name: "Chocolate", colors: ["#3b2218", "#5c3a28", "#8b5e3c", "#c69c72", "#f3e1c7"] },
  { name: "Pastel Dream", colors: ["#fbd1e0", "#cde7f0", "#e3d5f5", "#fdf0c2", "#d4f1de"] },
  { name: "Royal", colors: ["#1e2a5a", "#3c4f9b", "#d4af37", "#f5f0e6", "#7b2d43"] },
  { name: "Romance", colors: ["#9b1b30", "#d7263d", "#f49cbb", "#ffe5ec", "#ffffff"] },
  { name: "Tropical", colors: ["#ff9f1c", "#ffbf69", "#2ec4b6", "#cbf3f0", "#f72585"] },
  { name: "Ivory Wedding", colors: ["#fffaf0", "#f5ecd7", "#e9dcc9", "#d8c3a5", "#c9b79c"] },
];

export const FILLINGS = [
  { id: "classic", name: "Classic cream", price: 0 },
  { id: "ganache", name: "Chocolate ganache", price: 120 },
  { id: "fruit-compote", name: "Fresh fruit compote", price: 150 },
  { id: "salted-caramel", name: "Salted caramel", price: 140 },
  { id: "nutella", name: "Hazelnut praline", price: 180 },
  { id: "lotus-biscoff", name: "Biscoff crumble", price: 200 },
];

export const DRIP_COLORS: Record<string, string> = {
  dark: "#2b140b",
  white: "#f7efe2",
  gold: "#d4af37",
  caramel: "#b8732f",
  pink: "#f29bb2",
};

export const BASE_PLATES = [
  { id: "gold", name: "Gold board", color: "#d4af37" },
  { id: "silver", name: "Silver board", color: "#c7ccd4" },
  { id: "marble", name: "Marble stand", color: "#efece8" },
  { id: "wood", name: "Rustic wood", color: "#8a5a3b" },
  { id: "glass", name: "Glass pedestal", color: "#cfe8ef" },
] as const;

export const PACKAGING = [
  { id: "standard", name: "Standard box", note: "Recyclable kraft box" },
  { id: "premium", name: "Premium window box", note: "Rose-gold foil & ribbon" },
  { id: "luxury", name: "Luxury glass dome", note: "Keepsake acrylic dome" },
] as const;

export const BORDERS = [
  { id: "none", name: "No border" },
  { id: "pearl", name: "Pearl border" },
  { id: "shell", name: "Shell piping" },
  { id: "rosette", name: "Rosettes" },
  { id: "rope", name: "Rope twist" },
] as const;

export const MESSAGE_FONTS = [
  { id: "script", name: "Script" },
  { id: "elegant", name: "Elegant serif" },
  { id: "modern", name: "Modern sans" },
  { id: "playful", name: "Playful" },
  { id: "devanagari", name: "हिन्दी (Devanagari)" },
  { id: "telugu", name: "తెలుగు (Telugu)" },
] as const;

export const NAMED_COLORS: Record<string, string> = {
  red: "#c8102e",
  crimson: "#9b1b30",
  maroon: "#6d1a2a",
  pink: "#f4a6c1",
  blush: "#f8d0d8",
  rose: "#e8a598",
  "rose gold": "#b76e79",
  peach: "#ffcba4",
  orange: "#f28c28",
  yellow: "#f6d55c",
  lemon: "#fff07c",
  gold: "#d4af37",
  golden: "#d4af37",
  silver: "#c0c0c0",
  white: "#fffaf3",
  ivory: "#fffaf0",
  cream: "#f5e6d3",
  beige: "#e8d8c3",
  brown: "#6b3f2a",
  chocolate: "#4a2a1c",
  black: "#1b1b1b",
  green: "#4caf7a",
  mint: "#b8f2d4",
  teal: "#2ec4b6",
  blue: "#3c6fd8",
  navy: "#1e2a5a",
  "sky blue": "#9fd3f0",
  "baby blue": "#bfe3fa",
  purple: "#7b4bb7",
  lavender: "#cdb4f0",
  lilac: "#d8c0f0",
};
