"use client";
/** Human-readable summary of a cake configuration (review, cart, confirmation). */
import type { CakeConfig } from "@/types/cake";
import { FLAVORS, FROSTINGS, SHAPES, FILLINGS, COLOR_MODES } from "@/data/catalog";
import { getOccasion } from "@/data/occasions";
import { getDecoration } from "@/data/decorations";
import { servingsFor } from "@/lib/cake/dimensions";
import { CakeIllustration } from "@/components/builder/Fallback2D";
import { cn } from "@/lib/utils";

export function CakeThumb({ config, className }: { config: CakeConfig; className?: string }) {
  return config.thumbnail ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={config.thumbnail} alt={`Preview of ${config.name}`} className={cn("object-cover", className)} />
  ) : (
    <div className={cn("bg-[radial-gradient(circle_at_50%_40%,color-mix(in_oklab,var(--accent)_22%,transparent),transparent_70%)]", className)}>
      <CakeIllustration config={config} className="h-full w-full" />
    </div>
  );
}

export function decorationGroups(config: CakeConfig) {
  const m = new Map<string, number>();
  config.decorations.forEach((d) => m.set(d.decorationId, (m.get(d.decorationId) ?? 0) + 1));
  return [...m.entries()].map(([id, qty]) => ({ def: getDecoration(id)!, qty })).filter((x) => x.def);
}

export function CakeSpecs({ config, dense }: { config: CakeConfig; dense?: boolean }) {
  const occ = getOccasion(config.occasion);
  const rows: [string, React.ReactNode][] = [
    ["Occasion", config.occasion === "custom" && config.customOccasion ? config.customOccasion : occ.name],
    ["Shape", `${SHAPES.find((s) => s.id === config.shape)?.name}${config.shape === "number" || config.shape === "letter" ? ` “${config.shapeText}”` : ""}`],
    ["Weight", `${config.weightKg} kg · serves ${servingsFor(config.weightKg)}${config.eggless ? " · Eggless" : ""}`],
    ["Tiers", config.tiers.length],
    [
      "Flavours",
      [...new Set(config.tiers.map((t) => FLAVORS.find((f) => f.id === t.flavor)?.name))].join(", ") + (config.customFlavorNote ? ` (${config.customFlavorNote})` : ""),
    ],
    ["Frosting", [...new Set(config.tiers.map((t) => FROSTINGS.find((f) => f.id === t.frosting)?.name))].join(", ")],
    [
      "Colours",
      <span key="c" className="flex flex-wrap items-center gap-1.5">
        {config.tiers.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            <span className="h-3.5 w-3.5 rounded-full border border-white/20" style={{ background: t.colorMode === "gold" ? "#d4af37" : t.colorMode === "silver" ? "#c0c0c0" : t.colors[0] }} />
            {(t.colorMode === "two-tone" || t.colorMode === "ombre") && <span className="h-3.5 w-3.5 rounded-full border border-white/20" style={{ background: t.colors[1] }} />}
            <span className="text-xs text-muted">{COLOR_MODES.find((c) => c.id === t.colorMode)?.name}</span>
          </span>
        ))}
      </span>,
    ],
    ["Filling", FILLINGS.find((f) => f.id === config.extras.filling)?.name],
  ];
  const groups = decorationGroups(config);
  return (
    <dl className={cn("grid gap-x-6 text-sm", dense ? "gap-y-1.5" : "gap-y-2.5 sm:grid-cols-2")}>
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3 border-b border-line/60 pb-1.5 sm:block sm:border-0 sm:pb-0">
          <dt className="text-muted sm:text-[11px] sm:uppercase sm:tracking-wider">{k}</dt>
          <dd className="text-right font-medium sm:text-left">{v}</dd>
        </div>
      ))}
      <div className="sm:col-span-2">
        <dt className="text-muted sm:text-[11px] sm:uppercase sm:tracking-wider">Decorations</dt>
        <dd className="mt-1 flex flex-wrap gap-1.5">
          {groups.length ? (
            groups.map(({ def, qty }) => (
              <span key={def.id} className="chip text-xs">
                {def.emoji} {def.name} ×{qty}
                <span className={cn("ml-1 text-[9px] font-bold uppercase", def.edible ? "text-emerald-500" : "text-sky-400")}>{def.edible ? "edible" : "keepsake"}</span>
              </span>
            ))
          ) : (
            <span className="text-muted">None</span>
          )}
        </dd>
      </div>
      {config.message.text && (
        <div className="sm:col-span-2">
          <dt className="text-muted sm:text-[11px] sm:uppercase sm:tracking-wider">Message</dt>
          <dd className="font-medium">“{config.message.text}” <span className="text-xs text-muted">({config.message.material} · {config.message.position.replace("-", " ")}{config.message.curved ? " · curved" : ""})</span></dd>
        </div>
      )}
      {config.photo.dataUrl && (
        <div className="sm:col-span-2">
          <dt className="text-muted sm:text-[11px] sm:uppercase sm:tracking-wider">Edible photo</dt>
          <dd className="font-medium">{config.photo.shape === "circle" ? "Circular" : "Rectangular"} print included</dd>
        </div>
      )}
      {(config.extras.specialInstructions || config.extras.giftMessage) && (
        <div className="sm:col-span-2">
          <dt className="text-muted sm:text-[11px] sm:uppercase sm:tracking-wider">Notes</dt>
          <dd className="text-sm">
            {config.extras.giftMessage && <p>🎁 {config.extras.giftMessage}</p>}
            {config.extras.specialInstructions && <p>📝 {config.extras.specialInstructions}</p>}
          </dd>
        </div>
      )}
    </dl>
  );
}
