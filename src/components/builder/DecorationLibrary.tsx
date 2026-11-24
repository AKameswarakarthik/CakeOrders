"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, GripVertical, Heart, Search, Sparkles, X } from "lucide-react";
import { useCakeStore } from "@/store/cakeStore";
import { usePrefs } from "@/store/appStore";
import { DECORATION_CATEGORIES, DECORATIONS } from "@/data/decorations";
import { getOccasion } from "@/data/occasions";
import type { DecorationCategory, DecorationDef } from "@/types/cake";
import { cn, formatINR } from "@/lib/utils";
import { StepHeader, TierScope } from "./shared";
import { QtyStepper } from "./BasicSteps";

type Filter = DecorationCategory | "all" | "recommended" | "favorites";

export function DecorationThumb({ def, color, size = "md" }: { def: DecorationDef; color?: string; size?: "sm" | "md" }) {
  const c = color ?? def.colors[0];
  return (
    <span
      className={cn("relative grid shrink-0 place-items-center overflow-hidden rounded-xl", size === "sm" ? "h-9 w-9 text-lg" : "h-14 w-14 text-3xl")}
      style={{ background: `radial-gradient(circle at 30% 25%, ${c}55, ${c}22 60%, transparent), linear-gradient(135deg, rgba(255,255,255,0.08), rgba(0,0,0,0.12))` }}
      aria-hidden
    >
      <span className="drop-shadow">{def.emoji}</span>
      <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border border-white/50" style={{ background: c }} />
    </span>
  );
}

export function DecorationLibrary() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("recommended");
  const occasion = useCakeStore((s) => s.config.occasion);
  const decorations = useCakeStore((s) => s.config.decorations);
  const armed = useCakeStore((s) => s.armedDecoration);
  const { addDecoration, removeLastOf, arm } = useCakeStore.getState();
  const { favorites, toggleFavorite } = usePrefs();
  const occ = getOccasion(occasion);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    decorations.forEach((d) => m.set(d.decorationId, (m.get(d.decorationId) ?? 0) + 1));
    return m;
  }, [decorations]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = DECORATIONS;
    if (filter === "recommended") arr = occ.recommendedDecorations.map((id) => DECORATIONS.find((d) => d.id === id)!).filter(Boolean);
    else if (filter === "favorites") arr = DECORATIONS.filter((d) => favorites.includes(d.id));
    else if (filter !== "all") arr = DECORATIONS.filter((d) => d.category === filter);
    if (q) arr = DECORATIONS.filter((d) => `${d.name} ${d.category} ${d.description}`.toLowerCase().includes(q));
    return arr;
  }, [query, filter, occ, favorites]);

  const filters: { id: Filter; label: string }[] = [
    { id: "recommended", label: `✨ For ${occ.name}` },
    { id: "all", label: "All" },
    ...DECORATION_CATEGORIES.map((c) => ({ id: c.id as Filter, label: `${c.emoji} ${c.name}` })),
    { id: "favorites", label: "♥ Favourites" },
  ];

  return (
    <div>
      <StepHeader title="Decorations" subtitle="Drag onto the cake, click to place precisely, or tap + to auto-place. Each is a real 3D object." />
      <TierScope label="Add to" />
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input className="field pl-10" placeholder="Search roses, figurines, pearls…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search decorations" />
        {query && (
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" onClick={() => setQuery("")} aria-label="Clear search">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="scrollbar-thin -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-2" role="tablist" aria-label="Decoration categories">
        {filters.map((f) => (
          <button key={f.id} role="tab" aria-selected={filter === f.id && !query} className="chip shrink-0" data-active={filter === f.id && !query} onClick={() => (setFilter(f.id), setQuery(""))}>
            {f.label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {armed && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 flex items-center justify-between rounded-xl bg-accent/15 px-3 py-2 text-xs">
            <span className="flex items-center gap-2"><Crosshair className="h-4 w-4 text-accent" /> Click on the cake to place <b>{DECORATIONS.find((d) => d.id === armed)?.name}</b> (Shift-click to place several)</span>
            <button className="font-semibold text-accent" onClick={() => arm(null)}>Cancel</button>
          </motion.div>
        )}
      </AnimatePresence>

      {list.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
          {filter === "favorites" ? "No favourites yet — tap the heart on any decoration." : "No decorations match your search."}
        </div>
      ) : (
        <ul className="mt-3 grid gap-2.5">
          {list.map((def) => {
            const n = counts.get(def.id) ?? 0;
            const fav = favorites.includes(def.id);
            return (
              <motion.li
                key={def.id}
                layout
                draggable
                onDragStart={(e) => {
                  const ev = e as unknown as React.DragEvent;
                  ev.dataTransfer.setData("application/x-cake-decoration", def.id);
                  ev.dataTransfer.effectAllowed = "copy";
                }}
                className={cn("group flex cursor-grab items-center gap-3 rounded-2xl border bg-card p-2.5 transition active:cursor-grabbing", armed === def.id ? "border-accent" : "border-line hover:border-accent/50")}
              >
                <GripVertical className="h-4 w-4 shrink-0 text-muted/50" aria-hidden />
                <DecorationThumb def={def} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold">{def.name}</p>
                    <span className={cn("shrink-0 rounded-full px-1.5 py-px text-[9px] font-bold uppercase", def.edible ? "bg-emerald-500/15 text-emerald-500" : "bg-sky-500/15 text-sky-400")}>{def.edible ? "Edible" : "Non-edible"}</span>
                  </div>
                  <p className="text-xs text-muted">
                    {formatINR(def.price)} each · {def.sizes.join("/")} {def.requiresApproval ? "· needs approval" : ""}
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    {def.colors.slice(0, 5).map((c) => (
                      <span key={c} className="h-3 w-3 rounded-full border border-white/20" style={{ background: c }} title={c} />
                    ))}
                    <span className="ml-1 text-[10px] text-muted">{def.placement === "top" ? "Top only" : def.placement === "scatter" ? "Scatter" : "Top & sides"}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleFavorite(def.id)} className="grid h-7 w-7 place-items-center rounded-full hover:bg-accent/15" aria-label={fav ? `Remove ${def.name} from favourites` : `Add ${def.name} to favourites`} aria-pressed={fav}>
                      <Heart className={cn("h-3.5 w-3.5", fav ? "fill-accent text-accent" : "text-muted")} />
                    </button>
                    {def.placement !== "scatter" && (
                      <button onClick={() => arm(armed === def.id ? null : def.id)} className={cn("grid h-7 w-7 place-items-center rounded-full hover:bg-accent/15", armed === def.id && "bg-accent/25")} aria-label={`Click-to-place ${def.name}`} title="Click on the cake to place">
                        <Crosshair className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <QtyStepper label={def.name} value={n} onDec={() => removeLastOf(def.id)} onInc={() => addDecoration(def.id)} />
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted"><Sparkles className="h-3.5 w-3.5 text-accent" /> Tip: select a decoration on the cake to drag, resize, rotate or recolour it.</p>
    </div>
  );
}
