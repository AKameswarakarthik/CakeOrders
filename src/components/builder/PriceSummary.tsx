"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronUp, Info, ShieldCheck } from "lucide-react";
import { useCakeStore } from "@/store/cakeStore";
import { priceDesign } from "@/lib/pricing/PricingEngine";
import { validateDesign } from "@/lib/cake/validation";
import { formatINR, cn } from "@/lib/utils";
import { PRICING } from "@/data/pricing";
import type { CakeConfig, DesignWarning } from "@/types/cake";

export function AnimatedPrice({ value, className }: { value: number; className?: string }) {
  return (
    <motion.span key={value} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cn("inline-block tabular-nums", className)}>
      {formatINR(value)}
    </motion.span>
  );
}

export function PriceBreakdownList({ config, showTotals = true }: { config: CakeConfig; showTotals?: boolean }) {
  const price = useMemo(() => priceDesign(config), [config]);
  return (
    <div className="text-sm">
      <ul className="space-y-1.5">
        {price.lines.map((l, i) => (
          <li key={i} className="flex justify-between gap-3">
            <span className="text-muted">
              {l.label}
              {l.detail && <span className="ml-1 text-[11px] opacity-70">({l.detail})</span>}
            </span>
            <span className="tabular-nums">{formatINR(l.amount)}</span>
          </li>
        ))}
      </ul>
      {showTotals && (
        <div className="mt-3 space-y-1 border-t border-line pt-3">
          <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="tabular-nums">{formatINR(price.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted">GST ({Math.round(PRICING.gstRate * 100)}%)</span><span className="tabular-nums">{formatINR(price.tax)}</span></div>
          <div className="flex justify-between font-semibold"><span>Total (excl. delivery)</span><span className="tabular-nums">{formatINR(price.total)}</span></div>
        </div>
      )}
    </div>
  );
}

export function WarningList({ warnings }: { warnings: DesignWarning[] }) {
  if (!warnings.length) return null;
  return (
    <ul className="space-y-1.5">
      {warnings.map((w, i) => (
        <li key={i} className={cn("flex items-start gap-2 rounded-xl px-3 py-2 text-xs", w.level === "error" ? "bg-red-500/10 text-red-400" : w.level === "approval" ? "bg-amber-500/10 text-amber-500" : "bg-sky-500/10 text-sky-400")}>
          {w.level === "info" ? <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : w.level === "approval" ? <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
          <span>
            {w.level === "approval" && <b>Bakery approval: </b>}
            {w.message}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function PriceSummary({ onReview }: { onReview: () => void }) {
  const config = useCakeStore((s) => s.config);
  const [open, setOpen] = useState(false);
  const price = useMemo(() => priceDesign(config), [config]);
  const warnings = useMemo(() => validateDesign(config), [config]);
  const blocking = warnings.some((w) => w.level === "error");
  const flagged = warnings.filter((w) => w.level !== "info").length;
  return (
    <div className="glass-strong rounded-3xl p-3">
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="scrollbar-thin max-h-[40vh] space-y-3 overflow-y-auto px-2 pb-3 pt-1">
              <WarningList warnings={warnings} />
              <PriceBreakdownList config={config} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl px-2 py-1 text-left hover:bg-accent/10" aria-expanded={open} aria-label="Toggle price breakdown">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted">Live price incl. GST</p>
            <AnimatedPrice value={price.total} className="font-display text-2xl" />
          </div>
          {flagged > 0 && <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", blocking ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-500")}>{flagged} note{flagged > 1 ? "s" : ""}</span>}
          <ChevronUp className={cn("ml-auto h-4 w-4 shrink-0 transition", open ? "" : "rotate-180")} />
        </button>
        <button type="button" className="btn btn-primary px-5 py-3 text-sm" onClick={onReview}>
          Review My Cake
        </button>
      </div>
    </div>
  );
}
