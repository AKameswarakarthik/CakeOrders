"use client";
import { motion } from "framer-motion";
import type { ShapeId } from "@/types/cake";
import { useCakeStore } from "@/store/cakeStore";
import { cn } from "@/lib/utils";

export function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-2xl">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </div>
  );
}

export function OptionCard({ active, onClick, children, className, title, disabled }: { active?: boolean; onClick?: () => void; children: React.ReactNode; className?: string; title?: string; disabled?: boolean }) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      title={title}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "relative rounded-2xl border p-3 text-left transition-colors disabled:opacity-40",
        active ? "border-accent bg-accent/12 shadow-[0_0_0_1px_var(--accent)_inset,0_8px_30px_-12px_var(--accent)]" : "border-line bg-card hover:border-accent/50",
        className
      )}
    >
      {children}
    </motion.button>
  );
}

/** "Apply to: all tiers / tier n" scope selector */
export function TierScope({ label = "Apply to" }: { label?: string }) {
  const tiers = useCakeStore((s) => s.config.tiers.length);
  const active = useCakeStore((s) => s.activeTier);
  const set = useCakeStore((s) => s.setActiveTier);
  if (tiers < 2) return null;
  const opts: (number | "all")[] = ["all", ...Array.from({ length: tiers }, (_, i) => i)];
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2" role="radiogroup" aria-label={label}>
      <span className="label mr-1">{label}</span>
      {opts.map((o) => (
        <button key={String(o)} role="radio" aria-checked={active === o} className="chip" data-active={active === o} onClick={() => set(o)}>
          {o === "all" ? "All tiers" : `Tier ${o + 1}${o === 0 ? " (base)" : o === tiers - 1 ? " (top)" : ""}`}
        </button>
      ))}
    </div>
  );
}

/** the tier whose values are shown in a step (first of the scope) */
export function useScopedTier() {
  const active = useCakeStore((s) => s.activeTier);
  return useCakeStore((s) => s.config.tiers[active === "all" ? 0 : Math.min(active, s.config.tiers.length - 1)]);
}

export function ShapeIcon({ shape, className }: { shape: ShapeId; className?: string }) {
  const common = { fill: "currentColor", fillOpacity: 0.18, stroke: "currentColor", strokeWidth: 2 } as const;
  const paths: Record<ShapeId, React.ReactNode> = {
    round: <ellipse cx="24" cy="24" rx="17" ry="17" {...common} />,
    square: <rect x="8" y="8" width="32" height="32" rx="4" {...common} />,
    rectangle: <rect x="4" y="13" width="40" height="22" rx="3" {...common} />,
    heart: <path d="M24 40 C10 30 5 22 8 15 C11 8 20 8 24 15 C28 8 37 8 40 15 C43 22 38 30 24 40Z" {...common} />,
    hexagon: <path d="M24 6 L39 15 L39 33 L24 42 L9 33 L9 15Z" {...common} />,
    oval: <ellipse cx="24" cy="24" rx="20" ry="13" {...common} />,
    number: <text x="24" y="33" textAnchor="middle" fontSize="26" fontWeight="800" {...common}>21</text>,
    letter: <text x="24" y="34" textAnchor="middle" fontSize="28" fontWeight="800" {...common}>A</text>,
    dome: <path d="M7 34 C7 14 41 14 41 34Z" {...common} />,
    "multi-tier": (
      <g {...common}>
        <rect x="8" y="30" width="32" height="10" rx="2" />
        <rect x="13" y="20" width="22" height="10" rx="2" />
        <rect x="18" y="10" width="12" height="10" rx="2" />
      </g>
    ),
  };
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      {paths[shape]}
    </svg>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-line bg-card p-3.5">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-accent" : "bg-line")}
      >
        <motion.span layout className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow", checked ? "right-0.5" : "left-0.5")} />
      </button>
    </label>
  );
}
