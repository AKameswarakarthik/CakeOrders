import type { DecorationCategory, DecorationDef } from "@/types/cake";

export const DECORATION_CATEGORIES: { id: DecorationCategory; name: string; emoji: string }[] = [
  { id: "chocolate", name: "Chocolate", emoji: "🍫" },
  { id: "figurine", name: "Figurines", emoji: "🧸" },
  { id: "flower", name: "Flowers", emoji: "🌹" },
  { id: "luxury", name: "Luxury", emoji: "👑" },
  { id: "fruit", name: "Fruits", emoji: "🍓" },
  { id: "celebration", name: "Celebration", emoji: "🎉" },
];

const ALL = [
  "birthday",
  "anniversary",
  "engagement",
  "wedding",
  "baby-shower",
  "valentine",
  "graduation",
  "congratulations",
  "corporate",
  "custom",
] as const;
const ROMANTIC = ["anniversary", "engagement", "wedding", "valentine", "custom"] as const;
const CHOC = ["#3b1f14", "#6b3f2a", "#f3e6d0", "#e8a1b0"];
const S_M_L = ["S", "M", "L"] as const;

type Def = Omit<DecorationDef, "sizes" | "occasions"> & {
  sizes?: DecorationDef["sizes"];
  occasions?: readonly DecorationDef["occasions"][number][];
};

const d = (def: Def): DecorationDef => ({
  ...def,
  sizes: def.sizes ?? [...S_M_L],
  occasions: [...(def.occasions ?? ALL)],
});

export const DECORATIONS: DecorationDef[] = [
  // ── Chocolate ──────────────────────────────────────────
  d({ id: "choc-roses", name: "Chocolate Roses", category: "chocolate", model: "rose", price: 89, edible: true, emoji: "🌹", colors: ["#7a1022", "#3b1f14", "#f3e6d0", "#e8a1b0", "#d4af37"], placement: "any", radius: 0.12, maxQty: 24, description: "Hand-moulded couverture roses that bloom into place.", occasions: [...ROMANTIC, "birthday", "congratulations"] }),
  d({ id: "white-choc-roses", name: "White Chocolate Roses", category: "chocolate", model: "rose", price: 99, edible: true, emoji: "🤍", colors: ["#f7efe2", "#fbe3e8"], placement: "any", radius: 0.12, maxQty: 24, description: "Ivory white-chocolate roses for engagements & weddings.", occasions: ROMANTIC }),
  d({ id: "choc-stars", name: "Chocolate Stars", category: "chocolate", model: "star", price: 39, edible: true, emoji: "⭐", colors: ["#d4af37", "#3b1f14", "#f3e6d0", "#c0c0c0"], placement: "any", radius: 0.08, maxQty: 40, description: "Gold-dusted chocolate stars." }),
  d({ id: "choc-hearts", name: "Chocolate Hearts", category: "chocolate", model: "heart", price: 45, edible: true, emoji: "💗", colors: ["#c8102e", "#3b1f14", "#f4a6c1", "#f3e6d0"], placement: "any", radius: 0.08, maxQty: 40, description: "Glossy ruby & dark chocolate hearts.", occasions: [...ROMANTIC, "birthday", "baby-shower"] }),
  d({ id: "choc-couple", name: "Edible Chocolate Couple", category: "chocolate", model: "couple", price: 649, edible: true, emoji: "💑", colors: CHOC, placement: "top", radius: 0.22, maxQty: 1, heavy: true, description: "Hand-sculpted edible couple in milk & white chocolate.", occasions: ROMANTIC }),
  d({ id: "choc-bride-groom", name: "Chocolate Bride & Groom", category: "chocolate", model: "bride-groom", price: 899, edible: true, emoji: "👰", colors: CHOC, placement: "top", radius: 0.22, maxQty: 1, heavy: true, description: "Edible bride & groom sculpture.", occasions: ["wedding", "engagement"] }),
  d({ id: "choc-butterflies", name: "Chocolate Butterflies", category: "chocolate", model: "butterfly", price: 49, edible: true, emoji: "🦋", colors: ["#f4a6c1", "#cdb4f0", "#d4af37", "#3b1f14", "#9fd3f0"], placement: "any", radius: 0.09, maxQty: 24, description: "Delicate transfer-sheet butterflies." }),
  d({ id: "choc-balls", name: "Chocolate Balls", category: "chocolate", model: "ball", price: 29, edible: true, emoji: "🟤", colors: ["#3b1f14", "#d4af37", "#c0c0c0", "#f3e6d0", "#e8a1b0"], placement: "any", radius: 0.07, maxQty: 40, description: "Crunchy chocolate spheres, plain or metallic." }),
  d({ id: "choc-leaves", name: "Chocolate Leaves", category: "chocolate", model: "leaf", price: 25, edible: true, emoji: "🍃", colors: ["#3b1f14", "#4caf7a", "#d4af37"], placement: "any", radius: 0.08, maxQty: 30, description: "Veined chocolate leaves." }),
  d({ id: "choc-ribbons", name: "Chocolate Ribbons", category: "chocolate", model: "ribbon", price: 69, edible: true, emoji: "🎀", colors: ["#3b1f14", "#f3e6d0", "#e8a1b0", "#c8102e"], placement: "any", radius: 0.12, maxQty: 12, description: "Flowing tempered-chocolate curls." }),
  d({ id: "choc-letters", name: "Chocolate Letters", category: "chocolate", model: "letter", price: 35, edible: true, emoji: "🔤", colors: CHOC, placement: "any", radius: 0.08, maxQty: 20, defaultLabel: "A", description: "Individual chocolate letters — set the character in the inspector." }),
  d({ id: "choc-crowns", name: "Chocolate Crown", category: "chocolate", model: "crown", price: 149, edible: true, emoji: "👑", colors: ["#d4af37", "#3b1f14", "#c0c0c0"], placement: "top", radius: 0.13, maxQty: 3, description: "Gold-painted chocolate crown." }),
  d({ id: "choc-bars", name: "Chocolate Bars", category: "chocolate", model: "bar", price: 59, edible: true, emoji: "🍫", colors: ["#3b1f14", "#6b3f2a", "#f3e6d0"], placement: "any", radius: 0.1, maxQty: 20, description: "Premium bar pieces & wafer fingers." }),
  d({ id: "choc-shards", name: "Chocolate Shards", category: "chocolate", model: "shard", price: 49, edible: true, emoji: "🔺", colors: ["#3b1f14", "#f3e6d0", "#e8a1b0", "#d4af37"], placement: "top", radius: 0.1, maxQty: 20, description: "Dramatic marbled chocolate shards." }),
  d({ id: "choc-balloons", name: "Chocolate Balloons", category: "chocolate", model: "balloon", price: 79, edible: true, emoji: "🎈", colors: ["#f4a6c1", "#9fd3f0", "#f6d55c", "#c8102e", "#d4af37"], placement: "top", radius: 0.1, maxQty: 12, description: "Glossy hollow chocolate balloons on sugar sticks.", occasions: ["birthday", "baby-shower", "congratulations", "custom"] }),
  d({ id: "choc-ring", name: "Chocolate Engagement Ring", category: "chocolate", model: "ring", price: 299, edible: true, emoji: "💍", colors: ["#d4af37", "#c0c0c0", "#f3e6d0"], placement: "top", radius: 0.12, maxQty: 2, description: "Edible ring with an isomalt gem.", occasions: ["engagement", "wedding", "anniversary", "valentine"] }),

  // ── Figurines (non-edible) ─────────────────────────────
  d({ id: "romantic-couple", name: "Romantic Couple", category: "figurine", model: "couple", price: 499, edible: false, emoji: "👩‍❤️‍👨", colors: ["#ffffff", "#f4a6c1", "#1b1b1b"], placement: "top", radius: 0.22, maxQty: 1, heavy: true, description: "Resin couple figurine — keepsake, not edible.", occasions: ROMANTIC }),
  d({ id: "bride-groom", name: "Bride & Groom", category: "figurine", model: "bride-groom", price: 749, edible: false, emoji: "🤵", colors: ["#ffffff", "#f5ecd7"], placement: "top", radius: 0.22, maxQty: 1, heavy: true, description: "Porcelain bride & groom topper.", occasions: ["wedding", "engagement", "anniversary"] }),
  d({ id: "dancing-couple", name: "Dancing Couple", category: "figurine", model: "dancing-couple", price: 599, edible: false, emoji: "💃", colors: ["#c8102e", "#ffffff", "#1b1b1b"], placement: "top", radius: 0.22, maxQty: 1, heavy: true, description: "Elegant ballroom couple figurine.", occasions: ROMANTIC }),
  d({ id: "engagement-couple", name: "Engagement Couple", category: "figurine", model: "couple", price: 549, edible: false, emoji: "💏", colors: ["#f5ecd7", "#ffffff"], placement: "top", radius: 0.22, maxQty: 1, heavy: true, description: "Kneeling proposal figurine.", occasions: ["engagement", "anniversary", "valentine"] }),
  d({ id: "birthday-boy", name: "Birthday Boy", category: "figurine", model: "person", price: 349, edible: false, emoji: "👦", colors: ["#3c6fd8", "#4caf7a", "#f28c28"], placement: "top", radius: 0.12, maxQty: 2, description: "Party-hat boy figurine.", occasions: ["birthday", "custom"] }),
  d({ id: "birthday-girl", name: "Birthday Girl", category: "figurine", model: "person", price: 349, edible: false, emoji: "👧", colors: ["#f4a6c1", "#cdb4f0", "#f6d55c"], placement: "top", radius: 0.12, maxQty: 2, description: "Party-dress girl figurine.", occasions: ["birthday", "custom"] }),
  d({ id: "teddy-bear", name: "Teddy Bear", category: "figurine", model: "teddy", price: 299, edible: false, emoji: "🧸", colors: ["#c69c72", "#f4a6c1", "#bfe3fa", "#ffffff"], placement: "top", radius: 0.14, maxQty: 3, description: "Soft-touch teddy topper.", occasions: ["birthday", "baby-shower", "valentine", "custom"] }),
  d({ id: "cartoon-bear", name: "Cartoon Buddy", category: "figurine", model: "teddy", price: 279, edible: false, emoji: "🐻", colors: ["#f6d55c", "#9fd3f0", "#f28c28"], placement: "top", radius: 0.13, maxQty: 3, description: "Cartoon-inspired playful buddy.", occasions: ["birthday", "baby-shower"] }),
  d({ id: "custom-figurine", name: "Custom Figurine Request", category: "figurine", model: "custom-figurine", price: 1499, edible: false, emoji: "🎨", colors: ["#b76e79", "#ffffff"], placement: "top", radius: 0.18, maxQty: 1, heavy: true, requiresApproval: true, description: "Our artists sculpt your idea — requires bakery approval." }),

  // ── Flowers ────────────────────────────────────────────
  d({ id: "red-roses", name: "Red Roses", category: "flower", model: "rose", price: 69, edible: true, emoji: "🌹", colors: ["#c8102e", "#9b1b30"], placement: "any", radius: 0.12, maxQty: 30, description: "Buttercream piped red roses." }),
  d({ id: "pink-roses", name: "Pink Roses", category: "flower", model: "rose", price: 69, edible: true, emoji: "🌸", colors: ["#f4a6c1", "#f8d0d8", "#e8a598"], placement: "any", radius: 0.12, maxQty: 30, description: "Blush pink piped roses." }),
  d({ id: "white-roses", name: "White Roses", category: "flower", model: "rose", price: 69, edible: true, emoji: "🤍", colors: ["#fffaf3", "#f5ecd7"], placement: "any", radius: 0.12, maxQty: 30, description: "Ivory piped roses." }),
  d({ id: "sunflowers", name: "Sunflowers", category: "flower", model: "sunflower", price: 79, edible: true, emoji: "🌻", colors: ["#f6c90e", "#f28c28"], placement: "any", radius: 0.13, maxQty: 16, description: "Sunny fondant sunflowers." }),
  d({ id: "orchids", name: "Orchids", category: "flower", model: "orchid", price: 119, edible: true, emoji: "🌺", colors: ["#cdb4f0", "#ffffff", "#f4a6c1"], placement: "any", radius: 0.13, maxQty: 16, description: "Sugar-craft orchids." }),
  d({ id: "lotus", name: "Lotus Flowers", category: "flower", model: "lotus", price: 129, edible: true, emoji: "🪷", colors: ["#f8c8d4", "#ffffff", "#f6d55c"], placement: "top", radius: 0.14, maxQty: 10, description: "Traditional sugar lotus blooms." }),
  d({ id: "fondant-flowers", name: "Fondant Flowers", category: "flower", model: "flower", price: 59, edible: true, emoji: "🌼", colors: ["#ffffff", "#f8d0d8", "#cdb4f0", "#fdf0c2", "#bfe3fa"], placement: "any", radius: 0.09, maxQty: 40, description: "Cut-out fondant blossoms." }),
  d({ id: "choc-flowers", name: "Chocolate Flowers", category: "flower", model: "flower", price: 65, edible: true, emoji: "🏵️", colors: ["#3b1f14", "#6b3f2a", "#f3e6d0"], placement: "any", radius: 0.09, maxQty: 40, description: "Moulded chocolate blossoms." }),

  // ── Luxury ─────────────────────────────────────────────
  d({ id: "gold-leaf", name: "Edible Gold Leaf", category: "luxury", model: "gold-leaf", price: 249, edible: true, emoji: "✨", colors: ["#d4af37"], sizes: ["S", "M", "L"], placement: "any", radius: 0.12, maxQty: 10, description: "24-carat edible gold flakes." }),
  d({ id: "silver-leaf", name: "Edible Silver Leaf", category: "luxury", model: "gold-leaf", price: 199, edible: true, emoji: "🪙", colors: ["#c0c0c0"], placement: "any", radius: 0.12, maxQty: 10, description: "Edible silver leaf accents." }),
  d({ id: "golden-pearls", name: "Golden Pearls", category: "luxury", model: "pearls", price: 79, edible: true, emoji: "🟡", colors: ["#d4af37"], placement: "any", radius: 0.08, maxQty: 30, description: "Shimmering sugar pearl clusters." }),
  d({ id: "silver-pearls", name: "Silver Pearls", category: "luxury", model: "pearls", price: 69, edible: true, emoji: "⚪", colors: ["#c0c0c0", "#fffaf3"], placement: "any", radius: 0.08, maxQty: 30, description: "Silver dragée clusters." }),
  d({ id: "edible-glitter", name: "Edible Glitter", category: "luxury", model: "glitter", price: 149, edible: true, emoji: "💫", colors: ["#d4af37", "#c0c0c0", "#f4a6c1", "#cdb4f0"], sizes: ["M"], placement: "scatter", radius: 0, maxQty: 1, description: "Fine edible shimmer dust over the top tier." }),
  d({ id: "crown-topper", name: "Crown Topper", category: "luxury", model: "crown", price: 199, edible: false, emoji: "👑", colors: ["#d4af37", "#c0c0c0"], placement: "top", radius: 0.14, maxQty: 1, description: "Metallic tiara crown topper." }),
  d({ id: "edible-diamonds", name: "Edible Diamonds", category: "luxury", model: "diamond", price: 99, edible: true, emoji: "💎", colors: ["#e6f7ff", "#f4a6c1", "#cdb4f0", "#c8102e"], placement: "any", radius: 0.07, maxQty: 30, description: "Isomalt diamond-inspired gems." }),

  // ── Fruits ─────────────────────────────────────────────
  d({ id: "strawberries", name: "Strawberries", category: "fruit", model: "strawberry", price: 39, edible: true, emoji: "🍓", colors: ["#d7263d"], placement: "top", radius: 0.08, maxQty: 30, description: "Fresh strawberries, optionally chocolate-dipped." }),
  d({ id: "blueberries", name: "Blueberries", category: "fruit", model: "blueberry", price: 49, edible: true, emoji: "🫐", colors: ["#3a3f8f"], placement: "top", radius: 0.07, maxQty: 30, description: "Clusters of wild blueberries." }),
  d({ id: "cherries", name: "Cherries", category: "fruit", model: "cherry", price: 35, edible: true, emoji: "🍒", colors: ["#9b1b30"], placement: "top", radius: 0.07, maxQty: 30, description: "Glazed cherries with stems." }),
  d({ id: "raspberries", name: "Raspberries", category: "fruit", model: "raspberry", price: 45, edible: true, emoji: "🔴", colors: ["#d0315a"], placement: "top", radius: 0.06, maxQty: 30, description: "Tart fresh raspberries." }),
  d({ id: "mango-slices", name: "Mango Slices", category: "fruit", model: "mango", price: 49, edible: true, emoji: "🥭", colors: ["#ffb627"], placement: "top", radius: 0.09, maxQty: 20, description: "Alphonso mango fans." }),
  d({ id: "mixed-fruits", name: "Mixed Fruits", category: "fruit", model: "mixed-fruit", price: 99, edible: true, emoji: "🍇", colors: ["#d7263d"], placement: "top", radius: 0.14, maxQty: 10, description: "Seasonal fruit medley cluster." }),

  // ── Celebration ────────────────────────────────────────
  d({ id: "birthday-candles", name: "Birthday Candles", category: "celebration", model: "candle", price: 15, edible: false, emoji: "🕯️", colors: ["#f4a6c1", "#9fd3f0", "#f6d55c", "#ffffff", "#d4af37"], placement: "top", radius: 0.05, maxQty: 50, description: "Spiral candles with a flickering flame.", occasions: ["birthday", "anniversary", "congratulations", "graduation", "custom"] }),
  d({ id: "number-candle", name: "Number Candle", category: "celebration", model: "number-candle", price: 49, edible: false, emoji: "🔢", colors: ["#d4af37", "#f4a6c1", "#9fd3f0", "#c0c0c0"], placement: "top", radius: 0.1, maxQty: 4, defaultLabel: "1", description: "Glittered number candles — edit the digit." }),
  d({ id: "anniversary-number", name: "Anniversary Number Topper", category: "celebration", model: "number-candle", price: 129, edible: false, emoji: "🥇", colors: ["#d4af37", "#c0c0c0"], placement: "top", radius: 0.12, maxQty: 2, defaultLabel: "25", description: "Gold mirror-acrylic anniversary number.", occasions: ["anniversary", "wedding", "custom"] }),
  d({ id: "confetti", name: "Confetti", category: "celebration", model: "confetti", price: 79, edible: true, emoji: "🎊", colors: ["#f4a6c1"], sizes: ["M"], placement: "scatter", radius: 0, maxQty: 1, description: "Sugar confetti showered over the top." }),
  d({ id: "sprinkles", name: "Sprinkles", category: "celebration", model: "sprinkles", price: 59, edible: true, emoji: "🌈", colors: ["#f4a6c1"], sizes: ["M"], placement: "scatter", radius: 0, maxQty: 1, description: "Rainbow sprinkles that rain onto the cake." }),
  d({ id: "happy-birthday-topper", name: "Happy Birthday Topper", category: "celebration", model: "topper", price: 129, edible: false, emoji: "🎂", colors: ["#d4af37", "#c0c0c0", "#f4a6c1", "#1b1b1b"], placement: "top", radius: 0.2, maxQty: 1, defaultLabel: "Happy Birthday", description: "Mirror-acrylic script topper.", occasions: ["birthday"] }),
  d({ id: "happy-anniversary-topper", name: "Happy Anniversary Topper", category: "celebration", model: "topper", price: 129, edible: false, emoji: "💝", colors: ["#d4af37", "#c0c0c0", "#b76e79"], placement: "top", radius: 0.2, maxQty: 1, defaultLabel: "Happy Anniversary", description: "Rose-gold acrylic topper.", occasions: ["anniversary"] }),
  d({ id: "just-married-topper", name: "Just Married Topper", category: "celebration", model: "topper", price: 149, edible: false, emoji: "🥂", colors: ["#d4af37", "#c0c0c0", "#ffffff"], placement: "top", radius: 0.2, maxQty: 1, defaultLabel: "Just Married", description: "Wedding script topper.", occasions: ["wedding"] }),
  d({ id: "engagement-topper", name: "Engagement Topper", category: "celebration", model: "topper", price: 149, edible: false, emoji: "💍", colors: ["#d4af37", "#c0c0c0"], placement: "top", radius: 0.2, maxQty: 1, defaultLabel: "She Said Yes", description: "Engagement script topper.", occasions: ["engagement"] }),
  d({ id: "personal-topper", name: "Personalized Topper", category: "celebration", model: "topper", price: 199, edible: false, emoji: "🏷️", colors: ["#d4af37", "#c0c0c0", "#1b1b1b", "#b76e79"], placement: "top", radius: 0.2, maxQty: 2, defaultLabel: "Your Text", description: "Laser-cut topper with any text." }),
  d({ id: "initials-topper", name: "Personalized Initials", category: "celebration", model: "topper", price: 179, edible: false, emoji: "🔠", colors: ["#d4af37", "#c0c0c0", "#ffffff"], placement: "top", radius: 0.16, maxQty: 1, defaultLabel: "A & S", description: "Monogram initials topper.", occasions: ["wedding", "engagement", "anniversary", "custom"] }),
  d({ id: "wedding-bells", name: "Wedding Bells", category: "celebration", model: "bell", price: 159, edible: true, emoji: "🔔", colors: ["#d4af37", "#fffaf3", "#c0c0c0"], placement: "any", radius: 0.1, maxQty: 6, description: "Sugar-paste wedding bells.", occasions: ["wedding", "engagement", "anniversary"] }),
  d({ id: "rainbow-deco", name: "Rainbow Arch", category: "celebration", model: "rainbow", price: 149, edible: true, emoji: "🌈", colors: ["#f4a6c1"], placement: "top", radius: 0.2, maxQty: 1, description: "Fondant rainbow arch with clouds.", occasions: ["birthday", "baby-shower", "custom"] }),
  d({ id: "message-plaque", name: "Romantic Message Plaque", category: "celebration", model: "plaque", price: 99, edible: true, emoji: "📜", colors: ["#f7efe2", "#3b1f14", "#f4a6c1"], placement: "top", radius: 0.16, maxQty: 2, defaultLabel: "Forever", description: "White chocolate plaque with piped message.", occasions: ROMANTIC }),
];

export const DECORATION_MAP: Record<string, DecorationDef> = Object.fromEntries(
  DECORATIONS.map((x) => [x.id, x])
);

export const getDecoration = (id: string): DecorationDef | undefined => DECORATION_MAP[id];

export const SIZE_FACTOR: Record<string, number> = { S: 0.75, M: 1, L: 1.3 };
