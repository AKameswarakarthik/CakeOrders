"use client";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dices, IndianRupee, Layers, Loader2, Palette, Sparkles, Wand2 } from "lucide-react";
import { aiDesignService, type AIDesignResult } from "@/lib/ai/AIDesignService";
import { useCakeStore } from "@/store/cakeStore";
import { toast, useUI } from "@/store/appStore";
import { OCCASIONS } from "@/data/occasions";
import { getDecoration } from "@/data/decorations";
import { cakeSubtotal } from "@/lib/pricing/PricingEngine";
import { CakeIllustration, supportsWebGL } from "@/components/builder/Fallback2D";
import { CakeSpecs } from "@/components/cart/CakeSummary";
import { createDecoration } from "@/lib/cake/defaults";
import type { CakeConfig, OccasionId } from "@/types/cake";
import { cn, formatINR } from "@/lib/utils";

const CakeShowcase = dynamic(() => import("@/components/three/CakeShowcase"), { ssr: false, loading: () => <div className="skeleton h-full w-full" /> });

const EXAMPLES = [
  "I want a two-tier heart-shaped chocolate anniversary cake with red chocolate roses, a romantic couple figurine, golden stars, and Happy Anniversary written on the top.",
  "3 kg three tier white fondant wedding cake with bride and groom, white roses, golden pearls and gold leaf",
  "Number 18 birthday cake in pink whipped cream with sprinkles, strawberries and 'Happy 18th Riya'",
  "Eggless blueberry dome with mirror glaze ombre lavender and edible diamonds",
  "Square baby shower cake baby blue two-tone with teddy bear, chocolate balloons and stars",
];

type Busy = null | "generate" | "surprise" | "recommend" | "budget" | "colors" | "alts";

export default function AIDesignerPage() {
  const router = useRouter();
  const hydrated = useUI((s) => s.hydrated);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const [result, setResult] = useState<AIDesignResult | null>(null);
  const [alts, setAlts] = useState<AIDesignResult[]>([]);
  const [recs, setRecs] = useState<string[]>([]);
  const [budget, setBudget] = useState(2000);
  const [baseColor, setBaseColor] = useState("#b76e79");
  const [palettes, setPalettes] = useState<{ name: string; colors: string[] }[]>([]);
  const [occasion, setOccasion] = useState<OccasionId | "any">("any");
  const [webgl, setWebgl] = useState(true);
  useEffect(() => setWebgl(supportsWebGL()), []);

  // the design the tools act on: last AI result, otherwise the studio draft
  const studioConfig = useCakeStore((s) => s.config);
  const target: CakeConfig = result?.config ?? studioConfig;
  const price = useMemo(() => Math.round(cakeSubtotal(target) * 1.05), [target]);

  const run = async <T,>(kind: Busy, fn: () => Promise<T>) => {
    setBusy(kind);
    try {
      return await fn();
    } finally {
      setBusy(null);
    }
  };

  const generate = () => {
    if (prompt.trim().length < 8) return toast({ title: "Describe your dream cake in a sentence", tone: "info" });
    run("generate", async () => {
      const r = await aiDesignService.generateFromPrompt(prompt);
      setResult(r);
      setAlts([]);
    });
  };

  const applyRecs = (ids: string[]) => {
    if (!result) return;
    const c = { ...result.config, decorations: [...result.config.decorations] };
    const top = c.tiers.length - 1;
    ids.forEach((id, k) => {
      const def = getDecoration(id);
      if (!def) return;
      c.decorations.push(createDecoration(id, { tierIndex: top, pendingSnap: true, u: Math.cos(k * 2.4) * 0.5, v: Math.sin(k * 2.4) * 0.5 }));
    });
    setResult({ ...result, config: c, summary: [...result.summary, `Added ${ids.length} recommended decorations`] });
  };

  const openInStudio = (cfg: CakeConfig) => {
    useCakeStore.getState().load(cfg, { keepHistory: true });
    useCakeStore.getState().setStep(1);
    router.push("/studio");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="max-w-3xl">
        <p className="label flex items-center gap-2 text-accent"><Sparkles className="h-4 w-4" /> AI Cake Designer</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">Describe it. <span className="text-gradient italic">We&apos;ll design it.</span></h1>
        <p className="mt-3 text-muted">Type your dream cake in plain English — shape, tiers, flavour, colours, decorations and message — and watch it come to life in 3D.</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-5">
          <div className="glass rounded-3xl p-4">
            <label htmlFor="prompt" className="sr-only">Describe your cake</label>
            <textarea
              id="prompt"
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && generate()}
              placeholder="e.g. A two-tier heart-shaped chocolate anniversary cake with red chocolate roses, a couple figurine and 'Happy Anniversary' on top…"
              className="w-full resize-none bg-transparent text-base outline-none placeholder:text-muted/70"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-muted">⌘/Ctrl + Enter to generate</span>
              <button className="btn btn-primary px-5 py-2.5 text-sm" onClick={generate} disabled={busy !== null}>
                {busy === "generate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generate My Cake
              </button>
            </div>
          </div>
          <div>
            <p className="label mb-2">Try an example</p>
            <div className="flex flex-col gap-2">
              {EXAMPLES.map((ex) => (
                <button key={ex} onClick={() => setPrompt(ex)} className="glass rounded-2xl px-3.5 py-2.5 text-left text-xs text-muted transition hover:border-accent/50 hover:text-fg">
                  “{ex}”
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="glass rounded-3xl p-4">
              <p className="flex items-center gap-2 text-sm font-semibold"><Dices className="h-4 w-4 text-accent" /> Surprise Me</p>
              <select className="field mt-3 py-2 text-sm" value={occasion} onChange={(e) => setOccasion(e.target.value as OccasionId | "any")} aria-label="Occasion for surprise">
                <option value="any">Any occasion</option>
                {OCCASIONS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <button className="btn btn-ghost mt-3 w-full py-2 text-sm" disabled={busy !== null} onClick={() => run("surprise", async () => (setResult(await aiDesignService.surpriseMe(occasion === "any" ? undefined : occasion)), setAlts([])))}>
                {busy === "surprise" ? <Loader2 className="h-4 w-4 animate-spin" /> : "🎲"} Surprise me
              </button>
            </div>
            <div className="glass rounded-3xl p-4">
              <p className="flex items-center gap-2 text-sm font-semibold"><IndianRupee className="h-4 w-4 text-accent" /> Optimize My Budget</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-muted">₹</span>
                <input type="number" min={500} step={100} className="field py-2 text-sm" value={budget} onChange={(e) => setBudget(Math.max(0, parseInt(e.target.value || "0", 10)))} aria-label="Budget in rupees" />
              </div>
              <button className="btn btn-ghost mt-3 w-full py-2 text-sm" disabled={busy !== null || !hydrated} onClick={() => run("budget", async () => setResult(await aiDesignService.optimizeBudget(target, budget)))}>
                {busy === "budget" ? <Loader2 className="h-4 w-4 animate-spin" /> : "💸"} Fit to budget
              </button>
            </div>
            <div className="glass rounded-3xl p-4">
              <p className="flex items-center gap-2 text-sm font-semibold"><Palette className="h-4 w-4 text-accent" /> Suggest Matching Colours</p>
              <div className="mt-3 flex items-center gap-2">
                <input type="color" value={baseColor} onChange={(e) => setBaseColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg bg-transparent" aria-label="Base colour" />
                <button className="btn btn-ghost flex-1 py-2 text-sm" disabled={busy !== null} onClick={() => run("colors", async () => setPalettes(await aiDesignService.suggestColors(baseColor)))}>
                  Suggest
                </button>
              </div>
              {palettes.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {palettes.map((p) => (
                    <button
                      key={p.name}
                      className="flex w-full items-center gap-2 rounded-xl p-1 text-left hover:bg-accent/10"
                      title={result ? "Apply to the generated design" : "Generate a design first to apply"}
                      onClick={() =>
                        result &&
                        setResult({ ...result, config: { ...result.config, tiers: result.config.tiers.map((t, i) => ({ ...t, colors: [p.colors[i % p.colors.length], p.colors[(i + 1) % p.colors.length]] as [string, string] })) } })
                      }
                    >
                      <span className="w-24 text-[11px] text-muted">{p.name}</span>
                      {p.colors.map((c, i) => <span key={i} className="h-5 w-5 rounded-full border border-white/20" style={{ background: c }} />)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="glass rounded-3xl p-4">
              <p className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-accent" /> Recommend Decorations</p>
              <button className="btn btn-ghost mt-3 w-full py-2 text-sm" disabled={busy !== null || !hydrated} onClick={() => run("recommend", async () => setRecs(await aiDesignService.recommendDecorations(target)))}>
                {busy === "recommend" ? <Loader2 className="h-4 w-4 animate-spin" /> : "🌹"} Recommend
              </button>
              {recs.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1">
                    {recs.map((id) => <span key={id} className="chip text-[11px]">{getDecoration(id)?.emoji} {getDecoration(id)?.name}</span>)}
                  </div>
                  {result && <button className="mt-2 text-xs font-semibold text-accent" onClick={() => applyRecs(recs.slice(0, 3))}>Add top 3 to design →</button>}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:h-fit">
          <div className="glass relative h-[46vh] min-h-[340px] overflow-hidden rounded-[2rem]">
            <AnimatePresence mode="wait">
              {busy === "generate" || busy === "surprise" ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid h-full place-items-center">
                  <div className="text-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="mx-auto text-5xl">✨</motion.div>
                    <p className="mt-3 text-sm text-muted">Whisking your ideas into a design…</p>
                  </div>
                </motion.div>
              ) : result ? (
                <motion.div key={result.config.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                  {webgl ? <CakeShowcase config={result.config} className="!absolute inset-0" /> : <CakeIllustration config={result.config} className="h-full w-full" />}
                </motion.div>
              ) : (
                <motion.div key="empty" className="grid h-full place-items-center p-8 text-center text-muted">
                  <div>
                    <div className="text-6xl">🎂</div>
                    <p className="mt-3">Your AI-designed cake will appear here in 3D.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {result && busy === null && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass mt-4 rounded-3xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">{result.config.name}</h2>
                  <p className="text-xs text-muted">Confidence {Math.round(result.confidence * 100)}% · estimate {formatINR(price)} incl. GST</p>
                </div>
                <button className="btn btn-primary shrink-0 px-4 py-2 text-sm" onClick={() => openInStudio(result.config)}>
                  Open in studio
                </button>
              </div>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {result.summary.map((s, i) => <li key={i} className="chip text-[11px]">{s}</li>)}
              </ul>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-semibold text-accent">Full specification</summary>
                <div className="mt-3"><CakeSpecs config={result.config} dense /></div>
              </details>
              <button className="btn btn-ghost mt-4 w-full py-2.5 text-sm" disabled={busy !== null} onClick={() => run("alts", async () => setAlts(await aiDesignService.alternatives(result.config)))}>
                <Layers className="h-4 w-4" /> Generate Alternative Designs
              </button>
            </motion.div>
          )}
          {busy === "alts" && <div className="mt-4 h-40 skeleton rounded-3xl" />}
          {alts.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {alts.map((a) => (
                <button key={a.config.id} onClick={() => setResult(a)} className={cn("glass group rounded-2xl p-2 text-left transition hover:border-accent/60")}>
                  <CakeIllustration config={a.config} className="aspect-square w-full transition group-hover:scale-105" />
                  <p className="mt-1 truncate text-[11px] font-semibold">{a.summary[0]}</p>
                  <p className="truncate text-[10px] text-muted">{a.summary[1]}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
