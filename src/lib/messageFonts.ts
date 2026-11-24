import type { MessageFont } from "@/types/cake";

/**
 * Resolve the actual CSS font-family for canvas text rendering.
 * next/font exposes families via CSS variables on <html>; canvas needs the resolved names.
 */
const VAR: Record<MessageFont, string> = {
  script: "--font-script",
  elegant: "--font-elegant",
  modern: "--font-body",
  playful: "--font-playful",
  devanagari: "--font-devanagari",
  telugu: "--font-telugu",
};

const FALLBACK: Record<MessageFont, string> = {
  script: "cursive",
  elegant: "serif",
  modern: "sans-serif",
  playful: "sans-serif",
  devanagari: "'Noto Sans Devanagari', sans-serif",
  telugu: "'Noto Sans Telugu', sans-serif",
};

export function resolveFontFamily(font: MessageFont): string {
  if (typeof document === "undefined") return FALLBACK[font];
  const v = getComputedStyle(document.documentElement).getPropertyValue(VAR[font]).trim();
  return v ? `${v}, ${FALLBACK[font]}` : FALLBACK[font];
}

/** pick a script font automatically when the message contains Indic characters */
export function autoFontFor(text: string, chosen: MessageFont): MessageFont {
  if (/[ऀ-ॿ]/.test(text)) return "devanagari";
  if (/[ఀ-౿]/.test(text)) return "telugu";
  return chosen;
}

export const FONT_WEIGHT: Record<MessageFont, string> = {
  script: "400",
  elegant: "700",
  modern: "800",
  playful: "700",
  devanagari: "600",
  telugu: "600",
};
