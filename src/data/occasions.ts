import type { OccasionId, ShapeId } from "@/types/cake";

export interface OccasionDef {
  id: OccasionId;
  name: string;
  tagline: string;
  emoji: string;
  gradient: string; // css gradient for cards
  recommendedShapes: ShapeId[];
  recommendedColors: string[];
  /** decoration ids recommended for this occasion, in priority order */
  recommendedDecorations: string[];
  defaultMessage: string;
}

export const OCCASIONS: OccasionDef[] = [
  {
    id: "birthday",
    name: "Birthday",
    tagline: "Make a wish worth remembering",
    emoji: "🎂",
    gradient: "linear-gradient(135deg,#ff9a9e 0%,#fad0c4 50%,#fbc2eb 100%)",
    recommendedShapes: ["round", "number", "square", "multi-tier"],
    recommendedColors: ["#fbd1e0", "#cde7f0", "#fdf0c2", "#f4a6c1", "#7b4bb7"],
    recommendedDecorations: ["birthday-candles", "number-candle", "choc-stars", "choc-balloons", "happy-birthday-topper", "rainbow-deco", "sprinkles", "choc-letters", "birthday-boy", "birthday-girl", "cartoon-bear", "confetti"],
    defaultMessage: "Happy Birthday!",
  },
  {
    id: "anniversary",
    name: "Anniversary",
    tagline: "Celebrate every year of love",
    emoji: "💞",
    gradient: "linear-gradient(135deg,#b76e79 0%,#e8a598 50%,#f4c7c3 100%)",
    recommendedShapes: ["heart", "round", "multi-tier"],
    recommendedColors: ["#9b1b30", "#d7263d", "#f4c7c3", "#d4af37", "#fffaf3"],
    recommendedDecorations: ["choc-roses", "choc-couple", "romantic-couple", "choc-hearts", "message-plaque", "anniversary-number", "gold-leaf", "happy-anniversary-topper", "red-roses", "golden-pearls"],
    defaultMessage: "Happy Anniversary",
  },
  {
    id: "engagement",
    name: "Engagement",
    tagline: "The beginning of forever",
    emoji: "💍",
    gradient: "linear-gradient(135deg,#e0c3fc 0%,#f5e6d3 50%,#d4af37 100%)",
    recommendedShapes: ["round", "heart", "multi-tier"],
    recommendedColors: ["#fffaf0", "#f5ecd7", "#d4af37", "#c0c0c0", "#f8d0d8"],
    recommendedDecorations: ["choc-ring", "engagement-couple", "choc-couple", "white-roses", "edible-diamonds", "golden-pearls", "silver-pearls", "engagement-topper"],
    defaultMessage: "Forever Starts Now",
  },
  {
    id: "wedding",
    name: "Marriage / Wedding",
    tagline: "Grand tiers for the grandest day",
    emoji: "💒",
    gradient: "linear-gradient(135deg,#fdfbfb 0%,#ebedee 40%,#e9dcc9 100%)",
    recommendedShapes: ["multi-tier", "round", "hexagon"],
    recommendedColors: ["#fffaf0", "#f5ecd7", "#e9dcc9", "#d4af37", "#f8d0d8"],
    recommendedDecorations: ["bride-groom", "choc-bride-groom", "fondant-flowers", "choc-roses", "gold-leaf", "wedding-bells", "golden-pearls", "initials-topper", "just-married-topper", "white-roses"],
    defaultMessage: "Happily Ever After",
  },
  {
    id: "baby-shower",
    name: "Baby Shower",
    tagline: "Sweet beginnings",
    emoji: "🍼",
    gradient: "linear-gradient(135deg,#a1c4fd 0%,#c2e9fb 50%,#fbd1e0 100%)",
    recommendedShapes: ["round", "dome", "square"],
    recommendedColors: ["#bfe3fa", "#fbd1e0", "#fdf0c2", "#d4f1de", "#ffffff"],
    recommendedDecorations: ["teddy-bear", "choc-balloons", "choc-stars", "pink-roses", "silver-pearls", "sprinkles", "personal-topper"],
    defaultMessage: "Welcome Little One",
  },
  {
    id: "valentine",
    name: "Valentine's Day",
    tagline: "Say it with chocolate",
    emoji: "❤️",
    gradient: "linear-gradient(135deg,#ff0844 0%,#ffb199 100%)",
    recommendedShapes: ["heart", "round"],
    recommendedColors: ["#c8102e", "#9b1b30", "#f4a6c1", "#ffffff", "#d4af37"],
    recommendedDecorations: ["choc-hearts", "choc-roses", "red-roses", "romantic-couple", "strawberries", "edible-glitter", "gold-leaf"],
    defaultMessage: "Be Mine",
  },
  {
    id: "graduation",
    name: "Graduation",
    tagline: "Toast to the achiever",
    emoji: "🎓",
    gradient: "linear-gradient(135deg,#1e2a5a 0%,#3c4f9b 60%,#d4af37 100%)",
    recommendedShapes: ["square", "rectangle", "round"],
    recommendedColors: ["#1e2a5a", "#d4af37", "#ffffff", "#1b1b1b", "#c0c0c0"],
    recommendedDecorations: ["choc-stars", "crown-topper", "personal-topper", "gold-leaf", "confetti", "choc-letters"],
    defaultMessage: "Congrats Grad!",
  },
  {
    id: "congratulations",
    name: "Congratulations",
    tagline: "For every big win",
    emoji: "🥂",
    gradient: "linear-gradient(135deg,#f6d365 0%,#fda085 100%)",
    recommendedShapes: ["round", "square", "hexagon"],
    recommendedColors: ["#d4af37", "#fffaf3", "#f6d55c", "#1b1b1b", "#f4a6c1"],
    recommendedDecorations: ["choc-stars", "gold-leaf", "confetti", "personal-topper", "choc-shards", "golden-pearls"],
    defaultMessage: "Congratulations!",
  },
  {
    id: "corporate",
    name: "Corporate Celebration",
    tagline: "Branded & boardroom-ready",
    emoji: "🏢",
    gradient: "linear-gradient(135deg,#232526 0%,#414345 60%,#b76e79 100%)",
    recommendedShapes: ["rectangle", "square", "round"],
    recommendedColors: ["#1b1b1b", "#ffffff", "#3c6fd8", "#d4af37", "#c0c0c0"],
    recommendedDecorations: ["personal-topper", "choc-bars", "choc-shards", "silver-leaf", "choc-letters", "golden-pearls"],
    defaultMessage: "Cheers to the Team",
  },
  {
    id: "custom",
    name: "Custom Occasion",
    tagline: "Your story, your cake",
    emoji: "✨",
    gradient: "linear-gradient(135deg,#667eea 0%,#b76e79 100%)",
    recommendedShapes: ["round", "heart", "square", "multi-tier"],
    recommendedColors: ["#b76e79", "#f5e6d3", "#4a2a1c", "#f4c7c3", "#d4af37"],
    recommendedDecorations: ["choc-roses", "choc-stars", "strawberries", "gold-leaf", "personal-topper", "sprinkles"],
    defaultMessage: "Celebrate!",
  },
];

export const getOccasion = (id: OccasionId) => OCCASIONS.find((o) => o.id === id) ?? OCCASIONS[0];
