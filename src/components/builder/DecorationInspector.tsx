"use client";
import { motion } from "framer-motion";
import { Copy, RotateCw, Trash2, X } from "lucide-react";
import { useCakeStore } from "@/store/cakeStore";
import { getDecoration } from "@/data/decorations";
import { cn, formatINR } from "@/lib/utils";
import { DecorationThumb } from "./DecorationLibrary";

/** Inspector for the currently selected decoration: resize, rotate, recolour, move tier, remove. */
export function DecorationInspector() {
  const uid = useCakeStore((s) => s.selectedUid);
  const deco = useCakeStore((s) => s.config.decorations.find((d) => d.uid === s.selectedUid));
  const tiers = useCakeStore((s) => s.config.tiers.length);
  const { updateDecoration, removeDecoration, duplicateDecoration, select, beginTransient, endTransient } = useCakeStore.getState();
  if (!uid || !deco) return null;
  const def = getDecoration(deco.decorationId);
  if (!def) return null;
  const patch = (p: Parameters<typeof updateDecoration>[1]) => updateDecoration(deco.uid, p);
  const slider = (p: Parameters<typeof updateDecoration>[1]) => updateDecoration(deco.uid, p, { history: false });

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 30, opacity: 0 }}
      className="glass-strong glow pointer-events-auto w-full max-w-sm rounded-3xl p-3.5"
      role="dialog"
      aria-label={`Edit ${def.name}`}
    >
      <div className="flex items-center gap-3">
        <DecorationThumb def={def} color={deco.color} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{def.name}</p>
          <p className="text-[11px] text-muted">
            {def.edible ? "Edible" : "Non-edible keepsake"} · {formatINR(def.price)} · on {deco.surface} of tier {deco.tierIndex + 1}
          </p>
        </div>
        <button className="grid h-8 w-8 place-items-center rounded-full hover:bg-accent/15" onClick={() => duplicateDecoration(deco.uid)} aria-label="Duplicate decoration" title="Duplicate">
          <Copy className="h-4 w-4" />
        </button>
        <button className="grid h-8 w-8 place-items-center rounded-full text-red-400 hover:bg-red-500/15" onClick={() => removeDecoration(deco.uid)} aria-label="Remove decoration" title="Remove (Delete)">
          <Trash2 className="h-4 w-4" />
        </button>
        <button className="grid h-8 w-8 place-items-center rounded-full hover:bg-accent/15" onClick={() => select(null)} aria-label="Close inspector">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="label text-[10px]" htmlFor="deco-scale">Scale {Math.round(deco.scale * 100)}%</label>
          <input id="deco-scale" type="range" className="range" min={0.5} max={1.8} step={0.05} value={deco.scale} onPointerDown={beginTransient} onPointerUp={endTransient} onChange={(e) => slider({ scale: parseFloat(e.target.value) })} />
        </div>
        <div>
          <label className="label flex items-center gap-1 text-[10px]" htmlFor="deco-rot"><RotateCw className="h-3 w-3" /> Rotate {Math.round(((((deco.rotation * 180) / Math.PI) % 360) + 360) % 360)}°</label>
          <input id="deco-rot" type="range" className="range" min={-Math.PI} max={Math.PI} step={0.05} value={deco.rotation} onPointerDown={beginTransient} onPointerUp={endTransient} onChange={(e) => slider({ rotation: parseFloat(e.target.value) })} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex gap-1" role="radiogroup" aria-label="Size">
          {def.sizes.map((s) => (
            <button key={s} role="radio" aria-checked={deco.size === s} className="chip px-2.5 py-1 text-xs" data-active={deco.size === s} onClick={() => patch({ size: s })}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5" role="radiogroup" aria-label="Colour">
          {def.colors.map((c) => (
            <button key={c} role="radio" aria-checked={deco.color === c} aria-label={`Colour ${c}`} onClick={() => patch({ color: c })} className={cn("h-6 w-6 rounded-full border-2", deco.color === c ? "border-accent ring-2 ring-accent/40" : "border-white/20")} style={{ background: c }} />
          ))}
        </div>
        {tiers > 1 && (
          <select className="field w-auto py-1 text-xs" value={deco.tierIndex} onChange={(e) => patch({ tierIndex: parseInt(e.target.value, 10), pendingSnap: deco.surface === "top" })} aria-label="Move to tier">
            {Array.from({ length: tiers }, (_, i) => (
              <option key={i} value={i}>Tier {i + 1}</option>
            ))}
          </select>
        )}
      </div>
      {def.defaultLabel !== undefined && (
        <div className="mt-3">
          <label className="label text-[10px]" htmlFor="deco-label">Text</label>
          <input id="deco-label" className="field mt-1 py-1.5 text-sm" maxLength={def.model === "letter" ? 2 : def.model === "number-candle" ? 3 : 22} value={deco.label ?? ""} onChange={(e) => slider({ label: e.target.value })} onBlur={() => patch({ label: deco.label })} />
        </div>
      )}
      <p className="mt-2 text-[10px] text-muted">Drag on the cake to move · Delete to remove · [ / ] to rotate · Esc to deselect</p>
    </motion.div>
  );
}
