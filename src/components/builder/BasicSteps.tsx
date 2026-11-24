"use client";
/** Occasion, ShapeSelector, Size/weight, Tiers, FlavorSelector, FrostingSelector steps. */
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Info, Minus, Plus, Users } from "lucide-react";
import { useCakeStore } from "@/store/cakeStore";
import { OCCASIONS, getOccasion } from "@/data/occasions";
import { FLAVORS, FROSTINGS, MAX_CUSTOM_WEIGHT, MIN_WEIGHT_FOR_TIERS, SHAPES, WEIGHTS } from "@/data/catalog";
import { PRICING } from "@/data/pricing";
import { servingsFor } from "@/lib/cake/dimensions";
import { formatINR, cn } from "@/lib/utils";
import { OptionCard, ShapeIcon, StepHeader, TierScope, Toggle, useScopedTier } from "./shared";
import { toast } from "@/store/appStore";

export function OccasionStep() {
  const occasion = useCakeStore((s) => s.config.occasion);
  const custom = useCakeStore((s) => s.config.customOccasion ?? "");
  const update = useCakeStore((s) => s.update);
  return (
    <div>
      <StepHeader title="What are we celebrating?" subtitle="We'll tailor shapes, colours and decorations to your occasion." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {OCCASIONS.map((o, i) => (
          <motion.button
            key={o.id}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            whileHover={{ y: -3, rotate: -0.5 }}
            onClick={() =>
              update((c) => {
                c.occasion = o.id;
                if (!c.message.text || OCCASIONS.some((x) => x.defaultMessage === c.message.text)) c.message.text = o.defaultMessage;
                if (c.name.startsWith("My ")) c.name = `My ${o.name} Cake`;
              })
            }
            aria-pressed={occasion === o.id}
            className={cn("group relative overflow-hidden rounded-2xl border p-3 text-left transition", occasion === o.id ? "border-accent ring-1 ring-accent" : "border-line hover:border-accent/50")}
          >
            <div className="absolute inset-0 opacity-25 transition-opacity group-hover:opacity-40" style={{ background: o.gradient }} />
            <div className="relative">
              <span className="text-2xl transition-transform group-hover:scale-125 inline-block">{o.emoji}</span>
              <p className="mt-2 text-sm font-semibold leading-tight">{o.name}</p>
              <p className="text-[11px] text-muted">{o.tagline}</p>
            </div>
            {occasion === o.id && (
              <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-accent text-[#1a0f0b]">
                <Check className="h-3 w-3" />
              </span>
            )}
          </motion.button>
        ))}
      </div>
      {occasion === "custom" && (
        <div className="mt-4">
          <label className="label" htmlFor="custom-occ">Your occasion</label>
          <input id="custom-occ" className="field mt-1.5" placeholder="e.g. Retirement party, Housewarming…" value={custom} onChange={(e) => update((c) => void (c.customOccasion = e.target.value), { history: false })} />
        </div>
      )}
      <p className="mt-4 flex items-start gap-2 rounded-xl bg-accent/10 p-3 text-xs text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        Recommended for {getOccasion(occasion).name}: {getOccasion(occasion).recommendedShapes.map((s) => SHAPES.find((x) => x.id === s)?.name).join(", ")} shapes.
      </p>
    </div>
  );
}

export function ShapeSelector() {
  const shape = useCakeStore((s) => s.config.shape);
  const shapeText = useCakeStore((s) => s.config.shapeText);
  const occasion = useCakeStore((s) => s.config.occasion);
  const setShape = useCakeStore((s) => s.setShape);
  const update = useCakeStore((s) => s.update);
  const recommended = getOccasion(occasion).recommendedShapes;
  return (
    <div>
      <StepHeader title="Choose a shape" subtitle="The 3D geometry updates instantly." />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {SHAPES.map((s) => (
          <OptionCard key={s.id} active={shape === s.id} onClick={() => setShape(s.id)} className="flex flex-col items-center gap-1 py-4 text-center" title={s.description}>
            <ShapeIcon shape={s.id} className={cn("h-10 w-10", shape === s.id ? "text-accent" : "text-muted")} />
            <span className="text-xs font-semibold">{s.name}</span>
            {PRICING.shapeSurcharge[s.id] > 0 && <span className="text-[10px] text-muted">+{formatINR(PRICING.shapeSurcharge[s.id])}</span>}
            {recommended.includes(s.id) && <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-gold px-1.5 text-[9px] font-bold uppercase text-[#1a0f0b]">Pick</span>}
          </OptionCard>
        ))}
      </div>
      {(shape === "number" || shape === "letter") && (
        <div className="mt-5">
          <label className="label" htmlFor="shape-text">{shape === "number" ? "Number (1–2 digits)" : "Letter(s) (1–2)"}</label>
          <input
            id="shape-text"
            className="field mt-1.5 text-lg font-bold tracking-widest"
            value={shapeText}
            maxLength={2}
            inputMode={shape === "number" ? "numeric" : "text"}
            onChange={(e) => {
              const v = shape === "number" ? e.target.value.replace(/\D/g, "") : e.target.value.replace(/[^A-Za-z]/g, "").toUpperCase();
              if (v)
                update((c) => {
                  c.shapeText = v;
                  c.decorations.forEach((d) => (d.pendingSnap = true));
                });
            }}
          />
        </div>
      )}
      {shape === "dome" && <p className="mt-4 text-xs text-muted">Dome cakes are single-tier and look stunning in mirror glaze or velvet.</p>}
    </div>
  );
}

export function SizeSelector() {
  const weight = useCakeStore((s) => s.config.weightKg);
  const tiers = useCakeStore((s) => s.config.tiers.length);
  const eggless = useCakeStore((s) => s.config.eggless);
  const setWeight = useCakeStore((s) => s.setWeight);
  const update = useCakeStore((s) => s.update);
  const isPreset = WEIGHTS.some((w) => w.kg === weight);
  const [custom, setCustom] = useState(!isPreset);
  const min = MIN_WEIGHT_FOR_TIERS[tiers];
  return (
    <div>
      <StepHeader title="Weight & size" subtitle="Larger cakes grow in the preview and price updates live." />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {WEIGHTS.map((w) => (
          <OptionCard
            key={w.kg}
            active={!custom && weight === w.kg}
            onClick={() => {
              setCustom(false);
              if (w.kg < min) toast({ title: `${tiers} tiers need at least ${min} kg`, description: "Extra tiers will be removed.", tone: "info" });
              setWeight(w.kg);
            }}
            className="text-center"
          >
            <p className="font-display text-xl">{w.label}</p>
            <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-muted"><Users className="h-3 w-3" /> {servingsFor(w.kg)} servings</p>
          </OptionCard>
        ))}
        <OptionCard active={custom} onClick={() => setCustom(true)} className="text-center">
          <p className="font-display text-xl">Custom</p>
          <p className="mt-0.5 text-[11px] text-muted">up to {MAX_CUSTOM_WEIGHT} kg</p>
        </OptionCard>
      </div>
      {custom && (
        <div className="mt-5 rounded-2xl border border-line bg-card p-4">
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="weight-range">Custom weight</label>
            <span className="font-display text-xl">{weight} kg</span>
          </div>
          <input id="weight-range" type="range" className="range mt-3" min={0.5} max={MAX_CUSTOM_WEIGHT} step={0.5} value={weight} onChange={(e) => setWeight(parseFloat(e.target.value))} />
          <div className="mt-1 flex justify-between text-[11px] text-muted"><span>0.5 kg</span><span>{MAX_CUSTOM_WEIGHT} kg</span></div>
        </div>
      )}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="label">Serves</p>
          <p className="mt-1 font-display text-3xl">{servingsFor(weight)}</p>
          <p className="text-xs text-muted">guests (≈125 g slices)</p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="label">Base price</p>
          <p className="mt-1 font-display text-3xl">{formatINR(PRICING.basePerKg * weight)}</p>
          <p className="text-xs text-muted">{formatINR(PRICING.basePerKg)}/kg before upgrades</p>
        </div>
      </div>
      <div className="mt-4">
        <Toggle checked={eggless} onChange={(v) => update((c) => void (c.eggless = v))} label="Eggless" hint={`100% vegetarian · +${formatINR(PRICING.egglessPerKg)}/kg`} />
      </div>
    </div>
  );
}

export function TierEditor() {
  const tiers = useCakeStore((s) => s.config.tiers);
  const shape = useCakeStore((s) => s.config.shape);
  const weight = useCakeStore((s) => s.config.weightKg);
  const setTierCount = useCakeStore((s) => s.setTierCount);
  const update = useCakeStore((s) => s.update);
  const max = SHAPES.find((s) => s.id === shape)!.maxTiers;
  return (
    <div>
      <StepHeader title="Tiers" subtitle="Stack up to five tiers — each can have its own size, flavour, frosting & colour." />
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <OptionCard key={n} active={tiers.length === n} onClick={() => setTierCount(n)} className="flex flex-col items-center gap-1 py-3" title={n > max ? `Switches to a round cake` : undefined}>
            <svg viewBox="0 0 40 40" className={cn("h-9 w-9", tiers.length === n ? "text-accent" : "text-muted")} aria-hidden>
              {Array.from({ length: n }, (_, i) => {
                const w = 34 - i * (24 / Math.max(n, 2));
                const h = 30 / Math.max(n, 3);
                return <rect key={i} x={20 - w / 2} y={38 - (i + 1) * h} width={w} height={h - 1} rx={1.5} fill="currentColor" fillOpacity={0.25 + i * 0.12} stroke="currentColor" />;
              })}
            </svg>
            <span className="text-xs font-semibold">{n === 1 ? "Single" : `${n} tiers`}</span>
            <span className="text-[10px] text-muted">min {MIN_WEIGHT_FOR_TIERS[n]} kg</span>
          </OptionCard>
        ))}
      </div>
      {max < 5 && <p className="mt-3 text-xs text-muted">{SHAPES.find((s) => s.id === shape)?.name} cakes support up to {max} tier{max > 1 ? "s" : ""}. Choosing more switches to round.</p>}
      {tiers.length > 1 && (
        <div className="mt-5 space-y-3">
          <p className="label">Tier proportions</p>
          {[...tiers].map((t, i) => (
            <div key={t.id} className="rounded-2xl border border-line bg-card p-3.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Tier {i + 1} {i === 0 ? "· base" : i === tiers.length - 1 ? "· top" : ""}</span>
                <span className="text-muted">{Math.round(t.sizeScale * 100)}%</span>
              </div>
              <input
                type="range"
                className="range mt-2"
                aria-label={`Tier ${i + 1} size`}
                min={0.75}
                max={1.15}
                step={0.01}
                value={t.sizeScale}
                onChange={(e) =>
                  update((c) => {
                    c.tiers[i].sizeScale = parseFloat(e.target.value);
                    c.decorations.forEach((d) => d.surface === "top" && (d.pendingSnap = true));
                  })
                }
              />
            </div>
          ))}
          <p className="text-xs text-muted">Total weight {weight} kg is distributed across tiers by volume. Customise each tier&apos;s flavour, frosting and colours in the next steps.</p>
        </div>
      )}
    </div>
  );
}

export function FlavorSelector() {
  const tier = useScopedTier();
  const updateTiers = useCakeStore((s) => s.updateTiers);
  const note = useCakeStore((s) => s.config.customFlavorNote ?? "");
  const update = useCakeStore((s) => s.update);
  return (
    <div>
      <StepHeader title="Flavour" subtitle="Sponge & filling — prices shown per kg." />
      <TierScope />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {FLAVORS.map((f) => {
          const up = PRICING.flavorPerKg[f.id];
          return (
            <OptionCard key={f.id} active={tier.flavor === f.id} onClick={() => updateTiers({ flavor: f.id })} className="flex items-center gap-3 p-2.5">
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl" style={{ background: `repeating-linear-gradient(180deg, ${f.sponge} 0 9px, ${f.cream} 9px 12px)` }} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{f.name}</span>
                <span className="block truncate text-[11px] text-muted">{up ? `+${formatINR(up)}/kg` : "Included"}{f.premium ? " · Premium" : ""}</span>
              </span>
            </OptionCard>
          );
        })}
      </div>
      {tier.flavor === "custom" && (
        <div className="mt-4">
          <label className="label" htmlFor="custom-flavor">Describe your flavour</label>
          <textarea id="custom-flavor" className="field mt-1.5" rows={2} placeholder="e.g. Pistachio rose with saffron cream" value={note} onChange={(e) => update((c) => void (c.customFlavorNote = e.target.value), { history: false })} />
          <p className="mt-1 text-xs text-muted">Custom flavours are confirmed by our chef (bakery approval).</p>
        </div>
      )}
      <p className="mt-4 text-sm text-muted">{FLAVORS.find((f) => f.id === tier.flavor)?.note}</p>
    </div>
  );
}

const FROSTING_SWATCH: Record<string, string> = {
  buttercream: "radial-gradient(circle at 30% 30%, #fff7ec, #f2d9c0)",
  "whipped-cream": "radial-gradient(circle at 30% 30%, #ffffff, #efe8e1)",
  ganache: "radial-gradient(circle at 30% 25%, #8a5a3b, #2b140b 70%)",
  fondant: "linear-gradient(135deg, #fbeff3, #f1d6df)",
  "cream-cheese": "radial-gradient(circle at 30% 30%, #fffdf6, #efe3cc)",
  "mirror-glaze": "linear-gradient(135deg, #f6c1d1 0%, #ffffff 30%, #b76e79 60%, #3b1f14 100%)",
  naked: "repeating-linear-gradient(180deg, #e2b36b 0 8px, #fff3df 8px 11px)",
  "semi-naked": "repeating-linear-gradient(180deg, #e2b36b 0 8px, #fffaf3 8px 14px)",
  velvet: "radial-gradient(circle at 40% 40%, #d9465b, #7a1022)",
  "chocolate-drip": "linear-gradient(180deg, #2b140b 0 35%, #f7e7d6 35%)",
};

export function FrostingSelector() {
  const tier = useScopedTier();
  const updateTiers = useCakeStore((s) => s.updateTiers);
  return (
    <div>
      <StepHeader title="Frosting & texture" subtitle="Each finish renders with its own physically-based material." />
      <TierScope />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {FROSTINGS.map((f) => {
          const up = PRICING.frostingPerKg[f.id];
          return (
            <OptionCard key={f.id} active={tier.frosting === f.id} onClick={() => updateTiers({ frosting: f.id })} className="p-2.5">
              <span className="block h-14 w-full rounded-xl shadow-inner" style={{ background: FROSTING_SWATCH[f.id] }} />
              <span className="mt-2 block text-sm font-semibold">{f.name}</span>
              <span className="block text-[11px] text-muted">{f.note} · {up ? `+${formatINR(up)}/kg` : "Included"}</span>
              {!f.firm && <span className="mt-1 inline-block rounded-full bg-amber-500/15 px-1.5 text-[10px] text-amber-500">Soft — light decor</span>}
            </OptionCard>
          );
        })}
      </div>
    </div>
  );
}

export function QtyStepper({ value, onDec, onInc, label }: { value: number; onDec: () => void; onInc: () => void; label: string }) {
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-card" role="group" aria-label={label}>
      <button type="button" onClick={onDec} className="grid h-7 w-7 place-items-center rounded-full hover:bg-accent/15" aria-label={`Decrease ${label}`}>
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" onClick={onInc} className="grid h-7 w-7 place-items-center rounded-full hover:bg-accent/15" aria-label={`Increase ${label}`}>
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
