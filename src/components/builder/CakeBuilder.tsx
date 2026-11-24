"use client";
/**
 * CakeBuilder — split-screen studio: step-by-step controls (left) + sticky live 3D preview (right).
 * On mobile: compact sticky preview + expandable bottom sheet.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, GripHorizontal, Pencil } from "lucide-react";
import { useCakeStore } from "@/store/cakeStore";
import { toast } from "@/store/appStore";
import { cn } from "@/lib/utils";
import { FlavorSelector, FrostingSelector, OccasionStep, ShapeSelector, SizeSelector, TierEditor } from "./BasicSteps";
import { ColorPicker } from "./ColorPicker";
import { DecorationLibrary } from "./DecorationLibrary";
import { ExtrasPanel, MessageEditor, PhotoUploader } from "./MessagePhotoExtras";
import { PreviewPanel } from "./PreviewPanel";
import { PriceSummary } from "./PriceSummary";
import { captureThumbnail } from "./actions";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export const STEPS = [
  { id: "occasion", label: "Occasion", icon: "🎉", C: OccasionStep },
  { id: "shape", label: "Shape", icon: "🔷", C: ShapeSelector },
  { id: "size", label: "Size", icon: "⚖️", C: SizeSelector },
  { id: "tiers", label: "Tiers", icon: "🎂", C: TierEditor },
  { id: "flavor", label: "Flavour", icon: "🍫", C: FlavorSelector },
  { id: "frosting", label: "Frosting", icon: "🧁", C: FrostingSelector },
  { id: "colors", label: "Colours", icon: "🎨", C: ColorPicker },
  { id: "decor", label: "Decorations", icon: "🌹", C: DecorationLibrary },
  { id: "message", label: "Message", icon: "✍️", C: MessageEditor },
  { id: "photo", label: "Photo", icon: "📸", C: PhotoUploader },
  { id: "extras", label: "Extras", icon: "🎁", C: ExtrasPanel },
] as const;

function useStudioShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      const st = useCakeStore.getState();
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        if (e.shiftKey) st.redo();
        else st.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y" && !typing) {
        e.preventDefault();
        st.redo();
        return;
      }
      if (typing) return;
      if (e.key === "Escape") {
        st.select(null);
        st.arm(null);
      }
      const sel = st.selectedUid && st.config.decorations.find((d) => d.uid === st.selectedUid);
      if (!sel) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        st.removeDecoration(sel.uid);
      } else if (e.key === "[" || e.key === "]") {
        st.updateDecoration(sel.uid, { rotation: sel.rotation + (e.key === "]" ? 0.2 : -0.2) });
      } else if (e.key === "+" || e.key === "=") {
        st.updateDecoration(sel.uid, { scale: Math.min(1.8, sel.scale + 0.1) });
      } else if (e.key === "-") {
        st.updateDecoration(sel.uid, { scale: Math.max(0.5, sel.scale - 0.1) });
      } else if (e.key.startsWith("Arrow") && sel.surface === "top") {
        e.preventDefault();
        const d = 0.04;
        const du = e.key === "ArrowLeft" ? -d : e.key === "ArrowRight" ? d : 0;
        const dv = e.key === "ArrowUp" ? -d : e.key === "ArrowDown" ? d : 0;
        st.updateDecoration(sel.uid, { u: sel.u + du, v: sel.v + dv, pendingSnap: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

export function CakeBuilder() {
  const router = useRouter();
  const step = useCakeStore((s) => s.step);
  const setStep = useCakeStore((s) => s.setStep);
  const name = useCakeStore((s) => s.config.name);
  const update = useCakeStore((s) => s.update);
  const notice = useCakeStore((s) => s.lastNotice);
  const editingCart = useCakeStore((s) => s.editingCartId);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const desktop = useMediaQuery("(min-width: 1024px)", true);
  useStudioShortcuts();

  useEffect(() => {
    setVisited((v) => new Set(v).add(step));
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    if (notice) toast({ title: notice.text, tone: "info" });
  }, [notice]);

  const go = (i: number) => setStep(Math.max(0, Math.min(STEPS.length - 1, i)));
  const Current = STEPS[step].C;
  const progress = Math.round((visited.size / STEPS.length) * 100);

  const review = () => {
    const thumb = captureThumbnail();
    if (thumb) update((c) => void (c.thumbnail = thumb), { history: false });
    router.push("/review");
  };

  const stepNav = (
    <nav aria-label="Customisation steps" className="scrollbar-thin -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {STEPS.map((s, i) => (
        <button
          key={s.id}
          onClick={() => go(i)}
          aria-current={step === i ? "step" : undefined}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
            step === i ? "border-accent bg-accent text-[#1a0f0b]" : visited.has(i) ? "border-accent/40 bg-accent/10" : "border-line bg-card text-muted hover:text-fg"
          )}
        >
          <span aria-hidden>{s.icon}</span>
          {s.label}
        </button>
      ))}
    </nav>
  );

  const header = (
    <div className="space-y-3 border-b border-line px-4 pb-3 pt-4 sm:px-5">
      <div className="flex items-center justify-between gap-3">
        {editingName ? (
          <input
            autoFocus
            className="field py-1.5 font-display text-lg"
            defaultValue={name}
            onBlur={(e) => (update((c) => void (c.name = e.target.value.trim() || c.name)), setEditingName(false))}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            aria-label="Cake name"
          />
        ) : (
          <button className="group flex min-w-0 items-center gap-2 text-left" onClick={() => setEditingName(true)} title="Rename">
            <h1 className="truncate font-display text-xl">{name}</h1>
            <Pencil className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition group-hover:opacity-100" />
          </button>
        )}
        <span className="shrink-0 text-xs text-muted">Step {step + 1}/{STEPS.length}</span>
      </div>
      {editingCart && <p className="rounded-lg bg-sky-500/10 px-3 py-1.5 text-xs text-sky-400">Editing a cart item — “Add to cart” will update it.</p>}
      <div className="h-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Customisation progress">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-[#f4c7c3] via-[#e8a598] to-[#c9a14a]" animate={{ width: `${Math.max(8, ((step + 1) / STEPS.length) * 100)}%` }} />
      </div>
      {stepNav}
    </div>
  );

  const body = (
    <div ref={scrollRef} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
          <Current />
        </motion.div>
      </AnimatePresence>
      <div className="mt-8 flex justify-between">
        <button className="btn btn-ghost px-4 py-2 text-sm" onClick={() => go(step - 1)} disabled={step === 0}>
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        {step < STEPS.length - 1 ? (
          <button className="btn btn-ghost px-4 py-2 text-sm" onClick={() => go(step + 1)}>
            Next: {STEPS[step + 1].label} <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button className="btn btn-primary px-4 py-2 text-sm" onClick={review}>
            Review My Cake <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative h-[calc(100dvh-4rem)] overflow-hidden">
      {/* Desktop split — only one layout is mounted so there is a single WebGL canvas */}
      {desktop ? (
      <div className="grid h-full grid-cols-[minmax(400px,480px)_1fr]">
        <aside className="flex min-h-0 flex-col border-r border-line bg-bg/60 backdrop-blur-xl">
          {header}
          {body}
          <div className="p-3">
            <PriceSummary onReview={review} />
          </div>
        </aside>
        <section className="relative min-h-0" aria-label="Live 3D cake preview">
          <PreviewPanel />
        </section>
      </div>
      ) : (
      /* Mobile: sticky preview + bottom sheet */
      <div className="flex h-full flex-col">
        <section className="relative min-h-[34vh] flex-1" aria-label="Live 3D cake preview">
          <PreviewPanel compact />
        </section>
        <motion.div
          className="glass-strong relative z-30 flex min-h-0 flex-col rounded-t-3xl border-b-0 shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.5)]"
          animate={{ height: sheetOpen ? "74dvh" : "48dvh" }}
          transition={{ type: "spring", damping: 30, stiffness: 260 }}
        >
          <motion.button
            className="flex w-full justify-center py-1.5 text-muted"
            onClick={() => setSheetOpen((v) => !v)}
            onPanEnd={(_, info) => setSheetOpen(info.offset.y < 0)}
            aria-label={sheetOpen ? "Collapse controls" : "Expand controls"}
            aria-expanded={sheetOpen}
          >
            <GripHorizontal className="h-5 w-5" />
          </motion.button>
          <div className="-mt-3">{header}</div>
          {body}
          <div className="p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <PriceSummary onReview={review} />
          </div>
        </motion.div>
      </div>
      )}
    </div>
  );
}
