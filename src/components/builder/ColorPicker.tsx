"use client";
import { useEffect, useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { useCakeStore } from "@/store/cakeStore";
import { usePrefs } from "@/store/appStore";
import { COLOR_MODES, PALETTES } from "@/data/catalog";
import { PRICING } from "@/data/pricing";
import { getOccasion } from "@/data/occasions";
import { aiDesignService } from "@/lib/ai/AIDesignService";
import type { ColorMode } from "@/types/cake";
import { cn, formatINR, isHex } from "@/lib/utils";
import { StepHeader, TierScope, useScopedTier } from "./shared";

const MODE_PREVIEW: Record<ColorMode, (a: string, b: string) => string> = {
  solid: (a) => a,
  "two-tone": (a, b) => `linear-gradient(180deg, ${a} 50%, ${b} 50%)`,
  ombre: (a, b) => `linear-gradient(180deg, ${a}, ${b})`,
  rainbow: () => "linear-gradient(180deg,#c7a8f0,#9fc8f0,#9fe0a8,#f6e58a,#f6c48a,#f28c8c)",
  gold: () => "linear-gradient(135deg,#f7e08a,#d4af37 45%,#a07b1f 70%,#f3d77a)",
  silver: () => "linear-gradient(135deg,#ffffff,#c0c0c0 45%,#8d9299 70%,#eceef1)",
};

function Swatch({ color, active, onClick, label }: { color: string; active?: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label ?? color}
      aria-label={`Colour ${label ?? color}`}
      className={cn("h-8 w-8 rounded-full border-2 transition hover:scale-110", active ? "border-accent ring-2 ring-accent/50" : "border-white/20")}
      style={{ background: color }}
    />
  );
}

function HexField({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id + "-picker"} className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-line" style={{ background: value }}>
        <span className="sr-only">Pick colour</span>
        <input id={id + "-picker"} type="color" value={value.length === 7 ? value : "#ffffff"} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </label>
      <input
        id={id}
        className="field font-mono uppercase"
        value={text}
        maxLength={7}
        onChange={(e) => {
          const v = e.target.value.startsWith("#") ? e.target.value : "#" + e.target.value;
          setText(v);
          if (isHex(v) && v.length === 7) onChange(v.toLowerCase());
        }}
        aria-label="HEX colour"
      />
    </div>
  );
}

export function ColorPicker() {
  const tier = useScopedTier();
  const updateTiers = useCakeStore((s) => s.updateTiers);
  const occasion = useCakeStore((s) => s.config.occasion);
  const { recentColors, pushRecentColor } = usePrefs();
  const [slot, setSlot] = useState<0 | 1>(0);
  const [harmonies, setHarmonies] = useState<{ name: string; colors: string[] }[] | null>(null);
  const needsTwo = tier.colorMode === "two-tone" || tier.colorMode === "ombre";

  const setColor = (c: string) => {
    const colors: [string, string] = [...tier.colors] as [string, string];
    colors[needsTwo ? slot : 0] = c;
    updateTiers({ colors });
    pushRecentColor(c);
  };

  const suggest = async () => setHarmonies(await aiDesignService.suggestColors(tier.colors[0]));

  return (
    <div>
      <StepHeader title="Colours" subtitle="Solid, two-tone, ombré, rainbow or metallic finishes." />
      <TierScope />
      <p className="label mb-2">Finish</p>
      <div className="grid grid-cols-3 gap-2">
        {COLOR_MODES.map((m) => (
          <button key={m.id} type="button" onClick={() => updateTiers({ colorMode: m.id })} aria-pressed={tier.colorMode === m.id} className={cn("flex items-center gap-2 rounded-xl border p-2 text-left text-xs transition", tier.colorMode === m.id ? "border-accent bg-accent/10" : "border-line bg-card hover:border-accent/50")}>
            <span className="h-7 w-7 shrink-0 rounded-lg border border-white/10" style={{ background: MODE_PREVIEW[m.id](tier.colors[0], tier.colors[1]) }} />
            <span>
              <span className="block font-semibold">{m.name}</span>
              <span className="text-[10px] text-muted">{PRICING.colorMode[m.id] ? `+${formatINR(PRICING.colorMode[m.id])}` : "Included"}</span>
            </span>
          </button>
        ))}
      </div>

      {tier.colorMode !== "rainbow" && tier.colorMode !== "gold" && tier.colorMode !== "silver" && (
        <>
          {needsTwo && (
            <div className="mt-5 flex gap-2" role="tablist" aria-label="Colour slot">
              {(["Top / primary", tier.colorMode === "ombre" ? "Bottom fade" : "Bottom half"] as const).map((l, i) => (
                <button key={l} role="tab" aria-selected={slot === i} className="chip" data-active={slot === i} onClick={() => setSlot(i as 0 | 1)}>
                  <span className="h-3.5 w-3.5 rounded-full border border-white/20" style={{ background: tier.colors[i] }} /> {l}
                </button>
              ))}
            </div>
          )}
          <div className="mt-4">
            <p className="label mb-2">Custom colour</p>
            <HexField id="hex" value={tier.colors[needsTwo ? slot : 0]} onChange={setColor} />
          </div>
          <div className="mt-4">
            <p className="label mb-2">Recommended for {getOccasion(occasion).name}</p>
            <div className="flex flex-wrap gap-2">
              {getOccasion(occasion).recommendedColors.map((c) => (
                <Swatch key={c} color={c} active={tier.colors[needsTwo ? slot : 0] === c} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
          {recentColors.length > 0 && (
            <div className="mt-4">
              <p className="label mb-2">Recently used</p>
              <div className="flex flex-wrap gap-2">
                {recentColors.map((c) => (
                  <Swatch key={c} color={c} onClick={() => setColor(c)} />
                ))}
              </div>
            </div>
          )}
          <div className="mt-5 space-y-3">
            <p className="label">Preset palettes</p>
            {PALETTES.map((p) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-muted">{p.name}</span>
                <div className="flex flex-wrap gap-1.5">
                  {p.colors.map((c) => (
                    <Swatch key={c} color={c} active={tier.colors[needsTwo ? slot : 0] === c} onClick={() => setColor(c)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-line bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-accent" /> AI matching colours</p>
              <button type="button" className="btn btn-ghost px-3 py-1.5 text-xs" onClick={suggest}>
                <Wand2 className="h-3.5 w-3.5" /> Suggest
              </button>
            </div>
            {harmonies && (
              <div className="mt-3 space-y-2">
                {harmonies.map((h) => (
                  <button
                    key={h.name}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl p-1.5 text-left hover:bg-accent/10"
                    onClick={() => updateTiers({ colors: [h.colors[0], h.colors[1]] })}
                    title="Apply first two colours"
                  >
                    <span className="w-24 text-xs text-muted">{h.name}</span>
                    <span className="flex gap-1">
                      {h.colors.map((c, i) => (
                        <span key={i} className="h-6 w-6 rounded-full border border-white/20" style={{ background: c }} />
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
