/**
 * AIDesignService — interface + a rule-based mock implementation.
 * Swap `aiDesignService` for an LLM-backed implementation later (same interface).
 */
import type { CakeConfig, ColorMode, FlavorId, FrostingId, OccasionId, PlacedDecoration, ShapeId } from "@/types/cake";
import { createDecoration, createDefaultConfig, createTier, ringOf } from "@/lib/cake/defaults";
import { DECORATIONS, getDecoration } from "@/data/decorations";
import { NAMED_COLORS, MIN_WEIGHT_FOR_TIERS, PALETTES, FLAVORS, FROSTINGS } from "@/data/catalog";
import { getOccasion, OCCASIONS } from "@/data/occasions";
import { cakeSubtotal } from "@/lib/pricing/PricingEngine";
import { deepClone, mixHex, uid } from "@/lib/utils";

export interface AIDesignResult {
  config: CakeConfig;
  summary: string[];
  confidence: number;
}

export interface AIDesignService {
  generateFromPrompt(prompt: string, base?: CakeConfig): Promise<AIDesignResult>;
  surpriseMe(occasion?: OccasionId): Promise<AIDesignResult>;
  recommendDecorations(config: CakeConfig): Promise<string[]>;
  optimizeBudget(config: CakeConfig, budget: number): Promise<AIDesignResult>;
  suggestColors(baseColor: string): Promise<{ name: string; colors: string[] }[]>;
  alternatives(config: CakeConfig): Promise<AIDesignResult[]>;
}

const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms));
const rand = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];

const NUMBER_WORDS: Record<string, number> = { one: 1, single: 1, two: 2, double: 2, three: 3, triple: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, dozen: 12 };

const SHAPE_KEYWORDS: [RegExp, ShapeId][] = [
  [/heart/, "heart"],
  [/square/, "square"],
  [/rectang|sheet/, "rectangle"],
  [/hexagon|hex\b/, "hexagon"],
  [/oval/, "oval"],
  [/dome|bomb/, "dome"],
  [/number[- ]shaped|number cake|\bnumber\b/, "number"],
  [/letter[- ]shaped|letter cake|initial cake/, "letter"],
  [/round|circle|circular/, "round"],
];

const FLAVOR_KEYWORDS: [RegExp, FlavorId][] = [
  [/belgian/, "belgian-chocolate"],
  [/truffle/, "chocolate-truffle"],
  [/black ?forest/, "black-forest"],
  [/white ?forest/, "white-forest"],
  [/red ?velvet/, "red-velvet"],
  [/butterscotch/, "butterscotch"],
  [/strawberry(?! decor)/, "strawberry"],
  [/pineapple/, "pineapple"],
  [/blueberry/, "blueberry"],
  [/coffee|mocha|espresso/, "coffee"],
  [/rasmalai|ras malai/, "rasmalai"],
  [/kit ?kat/, "kitkat"],
  [/vanilla/, "vanilla"],
  [/chocolate|choco/, "chocolate"],
];

const FROSTING_KEYWORDS: [RegExp, FrostingId][] = [
  [/semi[- ]naked/, "semi-naked"],
  [/naked/, "naked"],
  [/mirror/, "mirror-glaze"],
  [/fondant/, "fondant"],
  [/ganache/, "ganache"],
  [/whipped/, "whipped-cream"],
  [/cream cheese/, "cream-cheese"],
  [/velvet finish|suede/, "velvet"],
  [/drip/, "chocolate-drip"],
  [/buttercream|butter cream/, "buttercream"],
];

const OCCASION_KEYWORDS: [RegExp, OccasionId][] = [
  [/anniversary/, "anniversary"],
  [/engag|proposal/, "engagement"],
  [/wedding|marriage|bride/, "wedding"],
  [/baby|shower|newborn/, "baby-shower"],
  [/valentine/, "valentine"],
  [/graduat/, "graduation"],
  [/congrat|promotion|success/, "congratulations"],
  [/corporate|office|team|company/, "corporate"],
  [/birthday|bday/, "birthday"],
];

/** decoration keyword → decoration id. More specific phrases first. */
const DECO_KEYWORDS: [RegExp, string][] = [
  [/white chocolate roses?/, "white-choc-roses"],
  [/chocolate roses?|choco roses?/, "choc-roses"],
  [/red roses?/, "red-roses"],
  [/pink roses?/, "pink-roses"],
  [/white roses?/, "white-roses"],
  [/roses?/, "choc-roses"],
  [/bride and groom|bride & groom|bride|groom/, "bride-groom"],
  [/dancing couple/, "dancing-couple"],
  [/engagement couple|proposal/, "engagement-couple"],
  [/chocolate couple|edible couple/, "choc-couple"],
  [/couple/, "romantic-couple"],
  [/golden stars?|gold stars?|stars?/, "choc-stars"],
  [/hearts?/, "choc-hearts"],
  [/butterfl/, "choc-butterflies"],
  [/chocolate balls?|balls?/, "choc-balls"],
  [/leaves|leaf(?!.*gold)/, "choc-leaves"],
  [/ribbons?/, "choc-ribbons"],
  [/crown/, "crown-topper"],
  [/shards?/, "choc-shards"],
  [/kit ?kat bars?|chocolate bars?|bars?/, "choc-bars"],
  [/balloons?/, "choc-balloons"],
  [/ring/, "choc-ring"],
  [/teddy|bear/, "teddy-bear"],
  [/birthday boy|boy/, "birthday-boy"],
  [/birthday girl|girl/, "birthday-girl"],
  [/sunflowers?/, "sunflowers"],
  [/orchids?/, "orchids"],
  [/lotus/, "lotus"],
  [/fondant flowers?|flowers?|floral/, "fondant-flowers"],
  [/gold leaf|gold foil|24k/, "gold-leaf"],
  [/silver leaf/, "silver-leaf"],
  [/golden pearls?|gold pearls?/, "golden-pearls"],
  [/pearls?/, "silver-pearls"],
  [/glitter|shimmer/, "edible-glitter"],
  [/diamonds?|gems?/, "edible-diamonds"],
  [/strawberr(y|ies) on|strawberries/, "strawberries"],
  [/blueberries/, "blueberries"],
  [/cherr(y|ies)/, "cherries"],
  [/raspberr/, "raspberries"],
  [/mango/, "mango-slices"],
  [/fruits?/, "mixed-fruits"],
  [/number candle/, "number-candle"],
  [/candles?/, "birthday-candles"],
  [/confetti/, "confetti"],
  [/sprinkles?/, "sprinkles"],
  [/bells?/, "wedding-bells"],
  [/rainbow/, "rainbow-deco"],
  [/plaque/, "message-plaque"],
  [/topper/, "personal-topper"],
];

function findColorNear(text: string, index: number): string | undefined {
  const window = text.slice(Math.max(0, index - 22), index);
  let best: { pos: number; hex: string } | undefined;
  for (const [name, hex] of Object.entries(NAMED_COLORS)) {
    const pos = window.lastIndexOf(name);
    if (pos >= 0 && (!best || pos > best.pos)) best = { pos, hex };
  }
  return best?.hex;
}

function findQuantityNear(text: string, index: number): number | undefined {
  const window = text.slice(Math.max(0, index - 16), index).trim().split(/\s+/);
  for (let i = window.length - 1; i >= 0; i--) {
    const w = window[i].replace(/[^a-z0-9]/g, "");
    if (/^\d{1,2}$/.test(w)) return parseInt(w, 10);
    if (NUMBER_WORDS[w]) return NUMBER_WORDS[w];
  }
  return undefined;
}

const firstMatch = <T,>(text: string, table: [RegExp, T][]) => table.find(([re]) => re.test(text))?.[1];

export function parsePrompt(prompt: string, base?: CakeConfig): AIDesignResult {
  const raw = prompt.trim();
  const text = raw.toLowerCase();
  const summary: string[] = [];
  let hits = 0;

  const occasion = firstMatch(text, OCCASION_KEYWORDS) ?? base?.occasion ?? "custom";
  const c = base ? deepClone(base) : createDefaultConfig(occasion);
  c.occasion = occasion;
  c.id = uid("cake_");
  summary.push(`Occasion: ${getOccasion(occasion).name}`);

  // tiers
  const tierMatch = text.match(/(\d|one|two|three|four|five|single|double|triple)[- ]?(tier|tiered|layer|storey)/);
  let tiers = c.tiers.length;
  if (tierMatch) {
    tiers = /^\d$/.test(tierMatch[1]) ? parseInt(tierMatch[1], 10) : NUMBER_WORDS[tierMatch[1]];
    tiers = Math.min(5, Math.max(1, tiers));
    hits++;
  }

  // shape
  const shape = firstMatch(text, SHAPE_KEYWORDS);
  if (shape) {
    c.shape = shape;
    hits++;
  } else if (tiers > 1) c.shape = "round";
  if (c.shape === "number") {
    const n = text.match(/number[^\d]{0,12}(\d{1,2})|(\d{1,2})(st|nd|rd|th)\b/);
    c.shapeText = n?.[1] ?? n?.[2] ?? "21";
    tiers = 1;
  }
  if (c.shape === "letter") {
    const l = raw.match(/letter\s+['"]?([A-Za-z])['"]?/);
    c.shapeText = l?.[1]?.toUpperCase() ?? "A";
    tiers = 1;
  }
  if (c.shape === "dome") tiers = 1;
  if (tiers > 1 && ["number", "letter", "dome"].includes(c.shape)) c.shape = "round";

  // weight
  const kg = text.match(/(\d+(?:\.\d+)?)\s?(kg|kilo)/);
  if (kg) {
    c.weightKg = Math.min(20, Math.max(0.5, parseFloat(kg[1])));
    hits++;
  }
  c.weightKg = Math.max(c.weightKg, MIN_WEIGHT_FOR_TIERS[tiers]);

  // flavour / frosting
  const flavor = firstMatch(text, FLAVOR_KEYWORDS) ?? c.tiers[0]?.flavor ?? "chocolate";
  const frosting = firstMatch(text, FROSTING_KEYWORDS) ?? (flavor.includes("chocolate") || flavor === "chocolate" ? "ganache" : "buttercream");
  if (/drip/.test(text) && frosting !== "chocolate-drip") c.extras.dripStyle = /gold/.test(text.slice(Math.max(0, text.indexOf("drip") - 12), text.indexOf("drip"))) ? "gold" : "dark";
  if (frosting === "chocolate-drip") c.extras.dripStyle = "dark";
  if (firstMatch(text, FLAVOR_KEYWORDS)) hits++;
  if (firstMatch(text, FROSTING_KEYWORDS)) hits++;

  // colours — look for "<color> frosting|cake|icing|base"
  const occ = getOccasion(occasion);
  let primary: string = flavor.includes("chocolate") || flavor === "black-forest" ? "#4a2a1c" : occ.recommendedColors[0];
  let secondary: string = occ.recommendedColors[1];
  const colorBase = text.match(/([a-z ]+?)\s(frosting|cake|icing|base|cream|fondant)/);
  if (colorBase) {
    const hex = findColorNear(colorBase[0], colorBase[0].length);
    if (hex) {
      primary = hex;
      hits++;
    }
  }
  let colorMode: ColorMode = "solid";
  if (/ombre|ombré|gradient/.test(text)) colorMode = "ombre";
  else if (/rainbow/.test(text) && !/rainbow arch/.test(text)) colorMode = "rainbow";
  else if (/two[- ]tone/.test(text)) colorMode = "two-tone";
  else if (/metallic gold|gold finish|golden finish|all gold/.test(text)) colorMode = "gold";
  else if (/metallic silver|silver finish/.test(text)) colorMode = "silver";
  if (colorMode === "ombre" || colorMode === "two-tone") secondary = mixHex(primary, "#ffffff", 0.6);
  if (/eggless|egg[- ]free|vegetarian|no egg/.test(text)) {
    c.eggless = true;
    summary.push("Eggless");
  }

  c.tiers = Array.from({ length: tiers }, () =>
    createTier({ flavor, frosting, colorMode, colors: [primary, secondary] })
  );
  summary.push(`${tiers} tier${tiers > 1 ? "s" : ""} · ${c.shape} · ${c.weightKg} kg`);
  summary.push(`${FLAVORS.find((f) => f.id === flavor)?.name} with ${FROSTINGS.find((f) => f.id === frosting)?.name}`);

  // decorations
  const decos: PlacedDecoration[] = [];
  const used = new Set<string>();
  let consumed = text;
  for (const [re, id] of DECO_KEYWORDS) {
    const m = consumed.match(re);
    if (!m || used.has(id)) continue;
    const def = getDecoration(id);
    if (!def) continue;
    used.add(id);
    hits++;
    const idx = m.index ?? 0;
    // blank out the match so generic patterns (e.g. "roses") don't double count
    consumed = consumed.slice(0, idx) + " ".repeat(m[0].length) + consumed.slice(idx + m[0].length);
    const color = findColorNear(text, idx) ?? def.colors[0];
    const colorOk = def.colors.includes(color) || def.category !== "fruit" ? color : def.colors[0];
    const qty = Math.min(def.maxQty, findQuantityNear(text, idx) ?? (def.heavy || def.maxQty <= 2 ? 1 : def.placement === "scatter" ? 1 : 6));
    const topTier = tiers - 1;
    if (def.placement === "scatter") decos.push(createDecoration(id, { tierIndex: topTier, color: colorOk }));
    else if (def.heavy || def.model === "topper" || qty === 1)
      decos.push(createDecoration(id, { tierIndex: topTier, color: colorOk, pendingSnap: true, u: decos.some((d) => d.tierIndex === topTier && d.u === 0) ? 0.35 : 0, v: 0 }));
    else if (def.model === "star" || def.model === "pearls" || def.model === "butterfly")
      decos.push(...ringOf(id, qty, { tierIndex: 0, surface: "side", color: colorOk, height: 0.55 }));
    else decos.push(...ringOf(id, qty, { tierIndex: tiers > 1 ? 0 : 0, radius: tiers > 1 ? 0.86 : 0.72, color: colorOk, phase: decos.length * 0.4 }));
    summary.push(`${qty} × ${def.name}${def.edible ? "" : " (non-edible)"}`);
  }
  c.decorations = decos;

  // message in quotes or "written X" / "with X written"
  const quoted = raw.match(/["“']([^"”']{2,40})["”']/);
  const written = raw.match(/([A-Z][\w !,&']{2,40}?)\s+written/i) ?? raw.match(/writ(?:ten|e|ing)\s+(?:on (?:the )?top\s+)?["“']?([A-Za-z][\w !,&']{2,40})/i);
  const msg = quoted?.[1] ?? written?.[1];
  if (msg) {
    c.message = { ...c.message, text: msg.replace(/\s+(on|at)\s+(the\s+)?top.*$/i, "").trim(), position: /side|front/.test(text) ? "side-front" : "top-front" };
    summary.push(`Message: “${c.message.text}”`);
    hits++;
  } else if (!base) c.message.text = occ.defaultMessage;
  if (/plaque/.test(text)) c.message.position = "plaque";

  c.name = `AI ${getOccasion(occasion).name} Cake`;
  c.templateId = undefined;
  return { config: c, summary, confidence: Math.min(0.98, 0.35 + hits * 0.08) };
}

export function surprise(occasion?: OccasionId): AIDesignResult {
  const occ = occasion ? getOccasion(occasion) : rand(OCCASIONS);
  const shape = rand(occ.recommendedShapes);
  const tiers = shape === "multi-tier" ? 2 + Math.floor(Math.random() * 2) : shape === "number" || shape === "dome" ? 1 : Math.random() > 0.6 ? 2 : 1;
  const c = createDefaultConfig(occ.id);
  c.shape = shape;
  c.weightKg = MIN_WEIGHT_FOR_TIERS[tiers] + (tiers === 1 ? rand([0.5, 1, 1.5]) : 0);
  const flavor = rand(FLAVORS.filter((f) => f.id !== "custom")).id;
  const frosting = rand(["buttercream", "ganache", "fondant", "whipped-cream", "velvet", "mirror-glaze"] as FrostingId[]);
  const palette = rand(PALETTES);
  const mode = rand(["solid", "solid", "ombre", "two-tone", "gold"] as ColorMode[]);
  c.tiers = Array.from({ length: tiers }, (_, i) => createTier({ flavor, frosting, colorMode: i === tiers - 1 && mode === "gold" ? "gold" : mode === "gold" ? "solid" : mode, colors: [palette.colors[i % 5], palette.colors[(i + 2) % 5]] }));
  const recs = occ.recommendedDecorations.slice(0, 8);
  const picks = [...recs].sort(() => Math.random() - 0.5).slice(0, 3);
  c.decorations = picks.flatMap((id, k) => {
    const def = getDecoration(id)!;
    if (def.placement === "scatter") return [createDecoration(id, { tierIndex: tiers - 1 })];
    if (def.heavy || def.maxQty <= 2) return [createDecoration(id, { tierIndex: tiers - 1, pendingSnap: true, u: k * 0.3 - 0.3 })];
    return ringOf(id, 5, { tierIndex: 0, radius: tiers > 1 ? 0.86 : 0.72, phase: k * 0.6 });
  });
  if (shape === "number") c.shapeText = String(10 + Math.floor(Math.random() * 60));
  c.extras.dripStyle = frosting === "ganache" && Math.random() > 0.4 ? rand(["gold", "white", "caramel"] as const) : "none";
  c.name = `Surprise ${occ.name} Cake`;
  return { config: c, summary: [`${occ.name} · ${shape} · ${tiers} tier(s)`, `${palette.name} palette`, ...picks.map((p) => getDecoration(p)!.name)], confidence: 1 };
}

export function optimize(config: CakeConfig, budget: number): AIDesignResult {
  const c = deepClone(config);
  const notes: string[] = [];
  const price = () => Math.round(cakeSubtotal(c) * 1.05);
  const steps: (() => string | null)[] = [
    () => (c.extras.packaging === "luxury" ? ((c.extras.packaging = "premium"), "Packaging → premium box") : null),
    () => (c.extras.basePlate === "glass" || c.extras.basePlate === "marble" ? ((c.extras.basePlate = "gold"), "Base → gold board") : null),
    () => {
      const t = c.tiers.find((x) => x.colorMode === "gold" || x.colorMode === "silver" || x.colorMode === "rainbow");
      return t ? ((t.colorMode = "solid"), "Metallic/rainbow finish → solid colour") : null;
    },
    () => {
      const t = c.tiers.find((x) => ["fondant", "mirror-glaze", "velvet"].includes(x.frosting));
      return t ? ((t.frosting = "buttercream"), "Premium frosting → buttercream") : null;
    },
    () => {
      // trim the most numerous decoration
      const counts = new Map<string, number>();
      c.decorations.forEach((d) => counts.set(d.decorationId, (counts.get(d.decorationId) ?? 0) + 1));
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
      if (!top || top[1] <= 2) return null;
      const idx = c.decorations.map((d) => d.decorationId).lastIndexOf(top[0]);
      c.decorations.splice(idx, 1);
      return `Fewer ${getDecoration(top[0])!.name}`;
    },
    () => (c.extras.dripStyle !== "none" ? ((c.extras.dripStyle = "none"), "Removed drip") : null),
    () => {
      const t = c.tiers.find((x) => ["belgian-chocolate", "rasmalai", "blueberry", "kitkat", "red-velvet", "custom"].includes(x.flavor));
      return t ? ((t.flavor = t.flavor === "rasmalai" ? "vanilla" : "chocolate"), "Premium flavour → classic") : null;
    },
    () => {
      const nonEdible = c.decorations.findIndex((d) => !getDecoration(d.decorationId)?.edible && getDecoration(d.decorationId)!.price > 300);
      if (nonEdible < 0) return null;
      const name = getDecoration(c.decorations[nonEdible].decorationId)!.name;
      c.decorations.splice(nonEdible, 1);
      return `Removed ${name}`;
    },
    () => {
      if (c.tiers.length > 1 && c.weightKg > MIN_WEIGHT_FOR_TIERS[c.tiers.length - 1]) {
        c.tiers.pop();
        c.decorations = c.decorations.map((d) => (d.tierIndex >= c.tiers.length ? { ...d, tierIndex: c.tiers.length - 1, pendingSnap: true } : d));
        if (c.shape === "multi-tier" && c.tiers.length < 2) c.shape = "round";
        return "One less tier";
      }
      return null;
    },
    () => (c.weightKg > 0.5 ? ((c.weightKg = Math.max(MIN_WEIGHT_FOR_TIERS[c.tiers.length], c.weightKg - 0.5)), `Weight → ${c.weightKg} kg`) : null),
  ];
  let guard = 0;
  while (price() > budget && guard++ < 40) {
    let changed = false;
    for (const s of steps) {
      if (price() <= budget) break;
      const r = s();
      if (r) {
        notes.push(r);
        changed = true;
      }
    }
    if (!changed) break;
  }
  c.decorations.forEach((d) => d.surface === "top" && (d.pendingSnap = true));
  const final = price();
  notes.unshift(final <= budget ? `New estimate ₹${final} (within ₹${budget})` : `Closest we can get: ₹${final}`);
  return { config: c, summary: notes, confidence: final <= budget ? 0.95 : 0.5 };
}

export function colorHarmonies(base: string): { name: string; colors: string[] }[] {
  const hex = base.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16) / 255, g = parseInt(hex.slice(2, 4), 16) / 255, b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const s = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
  if (max !== min) {
    if (max === r) h = (g - b) / (max - min) + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / (max - min) + 2;
    else h = (r - g) / (max - min) + 4;
    h *= 60;
  }
  const hsl = (hh: number, ss: number, ll: number) => {
    hh = ((hh % 360) + 360) % 360;
    const a = ss * Math.min(ll, 1 - ll);
    const f = (n: number) => {
      const k = (n + hh / 30) % 12;
      return Math.round(255 * (ll - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
        .toString(16)
        .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };
  const S = Math.max(0.35, s), L = Math.min(0.75, Math.max(0.35, l));
  return [
    { name: "Complementary", colors: [base, hsl(h + 180, S, L), hsl(h, S * 0.4, 0.92), "#d4af37"] },
    { name: "Analogous", colors: [base, hsl(h + 30, S, L), hsl(h - 30, S, L), hsl(h, S * 0.3, 0.94)] },
    { name: "Triadic", colors: [base, hsl(h + 120, S, L), hsl(h + 240, S, L), "#fffaf3"] },
    { name: "Monochrome", colors: [hsl(h, S, 0.3), hsl(h, S, 0.5), base, hsl(h, S, 0.85)] },
    { name: "Luxe Neutral", colors: [base, "#fffaf0", "#d4af37", "#3b2218"] },
  ];
}

class RuleBasedAIDesignService implements AIDesignService {
  async generateFromPrompt(prompt: string, base?: CakeConfig) {
    await delay(700);
    return parsePrompt(prompt, base);
  }
  async surpriseMe(occasion?: OccasionId) {
    await delay(500);
    return surprise(occasion);
  }
  async recommendDecorations(config: CakeConfig) {
    await delay(300);
    const used = new Set(config.decorations.map((d) => d.decorationId));
    const occ = getOccasion(config.occasion);
    const recs = occ.recommendedDecorations.filter((id) => !used.has(id));
    return recs.length ? recs.slice(0, 6) : DECORATIONS.filter((d) => !used.has(d.id)).slice(0, 6).map((d) => d.id);
  }
  async optimizeBudget(config: CakeConfig, budget: number) {
    await delay(500);
    return optimize(config, budget);
  }
  async suggestColors(baseColor: string) {
    await delay(250);
    return colorHarmonies(baseColor);
  }
  async alternatives(config: CakeConfig) {
    await delay(800);
    const variants: AIDesignResult[] = [];
    const occ = getOccasion(config.occasion);
    const shapes = occ.recommendedShapes.filter((s) => s !== config.shape && s !== "number" && s !== "letter");
    const frostings: FrostingId[] = ["fondant", "ganache", "velvet", "buttercream", "semi-naked"];
    PALETTES.slice(0, 6)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .forEach((p, i) => {
        const c = deepClone(config);
        c.id = uid("cake_");
        const shape = shapes[i % Math.max(1, shapes.length)] ?? config.shape;
        if (shape === "multi-tier" && c.tiers.length < 2) {
          c.tiers.push({ ...c.tiers[0], id: uid("t_") });
          c.weightKg = Math.max(c.weightKg, MIN_WEIGHT_FOR_TIERS[2]);
        }
        if (shape === "dome") c.tiers = c.tiers.slice(0, 1);
        c.decorations = c.decorations.map((d) => (d.tierIndex >= c.tiers.length ? { ...d, tierIndex: c.tiers.length - 1 } : d));
        c.shape = shape;
        const fr = frostings[(i + 1) % frostings.length];
        c.tiers = c.tiers.map((t, k) => ({ ...t, frosting: fr, colorMode: i === 2 ? "ombre" : "solid", colors: [p.colors[k % 5], p.colors[(k + 3) % 5]] }));
        c.decorations.forEach((d) => d.surface === "top" && (d.pendingSnap = true));
        c.name = `${config.name} — ${p.name}`;
        variants.push({ config: c, summary: [`${p.name} palette`, `${shape} · ${FROSTINGS.find((f) => f.id === fr)?.name}`], confidence: 0.8 });
      });
    return variants;
  }
}

export const aiDesignService: AIDesignService = new RuleBasedAIDesignService();
