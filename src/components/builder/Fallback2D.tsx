"use client";
/** 2D SVG fallback preview for devices without WebGL. Driven by the same CakeConfig. */
import type { CakeConfig } from "@/types/cake";
import { computeTierLayout } from "@/lib/cake/dimensions";
import { getDecoration } from "@/data/decorations";
import { DRIP_COLORS } from "@/data/catalog";

export function Fallback2D({ config }: { config: CakeConfig }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-4">
      <CakeIllustration config={config} className="h-full max-h-[520px] w-full" />
      <p className="mt-2 text-center text-xs text-muted">3D preview unavailable on this device — showing a 2D preview. All options still work.</p>
    </div>
  );
}

/** SVG illustration of a cake config (fallback preview & lightweight thumbnails). */
export function CakeIllustration({ config, className, idKey }: { config: CakeConfig; className?: string; idKey?: string }) {
  const layouts = computeTierLayout(config);
  const H = layouts.reduce((s, l) => s + l.height, 0);
  const W = Math.max(...layouts.map((l) => l.width));
  const scale = Math.min(300 / W, 260 / H);
  const base = 330;
  const gid = (idKey ?? config.id).replace(/[^a-z0-9]/gi, "");
  return (
      <svg viewBox="0 0 400 400" className={className} role="img" aria-label={`Illustration of ${config.name}`}>
        <defs>
          {config.tiers.map((t, i) => (
            <linearGradient key={i} id={`tg${gid}${i}`} x1="0" y1="0" x2="0" y2="1">
              {t.colorMode === "rainbow" ? (
                ["#c7a8f0", "#9fc8f0", "#9fe0a8", "#f6e58a", "#f6c48a", "#f28c8c"].map((c, k) => <stop key={k} offset={k / 5} stopColor={c} />)
              ) : (
                <>
                  <stop offset="0" stopColor={t.colorMode === "gold" ? "#f3d77a" : t.colorMode === "silver" ? "#ffffff" : t.colors[0]} />
                  <stop offset={t.colorMode === "two-tone" ? 0.5 : 1} stopColor={t.colorMode === "gold" ? "#b8922c" : t.colorMode === "silver" ? "#9aa0a8" : t.colorMode === "solid" ? t.colors[0] : t.colors[0]} />
                  {(t.colorMode === "two-tone" || t.colorMode === "ombre") && <stop offset={t.colorMode === "two-tone" ? 0.5 : 1} stopColor={t.colors[1]} />}
                </>
              )}
            </linearGradient>
          ))}
        </defs>
        <ellipse cx="200" cy={base + 8} rx={r1((W * scale) / 2 + 30)} ry="14" fill="#d4af37" opacity="0.8" />
        {layouts.map((l, i) => {
          const w = r1(l.width * scale);
          const h = r1(l.height * scale);
          const y = r1(base - (l.y + l.height) * scale);
          const rx = config.shape === "square" || config.shape === "rectangle" ? 6 : config.shape === "dome" ? w / 2 : 18;
          return (
            <g key={i}>
              <rect x={200 - w / 2} y={y} width={w} height={h} rx={rx} fill={`url(#tg${gid}${i})`} stroke="rgba(0,0,0,0.15)" />
              {i === layouts.length - 1 && config.extras.dripStyle !== "none" && (
                <path d={`M${200 - w / 2} ${y + 6} ${Array.from({ length: 10 }, (_, k) => `q ${w / 20} ${k % 2 ? 22 : 10} ${w / 10} 0`).join(" ")}`} fill={DRIP_COLORS[config.extras.dripStyle]} />
              )}
            </g>
          );
        })}
        {config.message.text && (
          <text x="200" y={r1(base - layouts[0].height * scale * 0.45)} textAnchor="middle" fontSize="18" fill={config.message.color} fontFamily="var(--font-script), cursive">
            {config.message.text}
          </text>
        )}
        {config.decorations.slice(0, 30).map((d) => {
          const def = getDecoration(d.decorationId);
          const l = layouts[Math.min(d.tierIndex, layouts.length - 1)];
          if (!def || !l) return null;
          const x = r1(200 + (d.surface === "top" ? d.u * (l.width / 2) : Math.cos(d.u) * (l.width / 2)) * scale);
          const y = r1(base - (d.surface === "top" ? l.y + l.height : l.y + d.v * l.height) * scale);
          return (
            <text key={d.uid} x={x} y={y + (d.surface === "top" ? -2 : 6)} fontSize="18" textAnchor="middle">
              {def.emoji}
            </text>
          );
        }).filter((_, i) => i < 30)}
      </svg>
  );
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function supportsWebGL(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}
