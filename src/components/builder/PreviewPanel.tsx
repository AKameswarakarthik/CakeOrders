"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Eye, Heart, Maximize2, Redo2, RotateCcw, Rotate3d, Share2, Undo2, Box, ArrowUpFromDot, MoveHorizontal } from "lucide-react";
import { useCakeStore, type CameraView } from "@/store/cakeStore";
import { confirmDialog } from "@/store/appStore";
import { cn } from "@/lib/utils";
import { sceneBridge } from "@/store/cakeStore";
import { toast } from "@/store/appStore";
import { DecorationInspector } from "./DecorationInspector";
import { Fallback2D, supportsWebGL } from "./Fallback2D";
import { downloadScreenshot, saveCurrentDesign, shareDesign } from "./actions";

const CakeScene = dynamic(() => import("@/components/three/CakeScene"), {
  ssr: false,
  loading: () => <SceneLoader />,
});

function SceneLoader() {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-16 w-16">
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
          <span className="absolute inset-3 grid place-items-center text-2xl">🎂</span>
        </div>
        <p className="text-sm text-muted">Preheating the 3D oven…</p>
      </div>
    </div>
  );
}

function ToolButton({ label, onClick, active, children, disabled }: { label: string; onClick: () => void; active?: boolean; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn("group relative grid h-9 w-9 place-items-center rounded-xl transition disabled:opacity-30", active ? "bg-accent text-[#1a0f0b]" : "text-fg/80 hover:bg-accent/15 hover:text-fg")}
    >
      {children}
      <span className="pointer-events-none absolute -bottom-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/80 px-2 py-1 text-[10px] text-white group-hover:block">{label}</span>
    </button>
  );
}

export function PreviewPanel({ compact = false }: { compact?: boolean }) {
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const config = useCakeStore((s) => s.config);
  const canUndo = useCakeStore((s) => s.past.length > 0);
  const canRedo = useCakeStore((s) => s.future.length > 0);
  const view = useCakeStore((s) => s.cameraView);
  const autoRotate = useCakeStore((s) => s.autoRotate);
  const armed = useCakeStore((s) => s.armedDecoration);
  const selected = useCakeStore((s) => s.selectedUid);
  const { undo, redo, reset, setCameraView, setAutoRotate } = useCakeStore.getState();
  const [dropping, setDropping] = useState(false);

  useEffect(() => setWebgl(supportsWebGL()), []);

  const views: { id: CameraView; label: string; icon: React.ReactNode }[] = [
    { id: "iso", label: "3/4 view", icon: <Box className="h-4 w-4" /> },
    { id: "front", label: "Front view", icon: <Eye className="h-4 w-4" /> },
    { id: "side", label: "Side view", icon: <MoveHorizontal className="h-4 w-4" /> },
    { id: "top", label: "Top view", icon: <ArrowUpFromDot className="h-4 w-4" /> },
  ];

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", dropping && "ring-2 ring-inset ring-accent")}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("application/x-cake-decoration")) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          setDropping(true);
        }
      }}
      onDragLeave={() => setDropping(false)}
      onDrop={(e) => {
        setDropping(false);
        const id = e.dataTransfer.getData("application/x-cake-decoration");
        if (!id) return;
        e.preventDefault();
        const ok = sceneBridge.dropAt?.(e.clientX, e.clientY, id);
        if (!ok) {
          useCakeStore.getState().addDecoration(id);
          toast({ title: "Dropped beside the cake", description: "Auto-placed on the top tier instead.", tone: "info" });
        }
      }}
    >
      {/* soft studio backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,color-mix(in_oklab,var(--accent)_16%,transparent),transparent_65%)]" />
      {webgl === null ? <SceneLoader /> : webgl ? <CakeScene className="!absolute inset-0" /> : <Fallback2D config={config} />}

      {/* toolbar */}
      <div className={cn("absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-2xl p-1 glass-strong", compact && "scale-90")}>
        <ToolButton label="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo}><Undo2 className="h-4 w-4" /></ToolButton>
        <ToolButton label="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}><Redo2 className="h-4 w-4" /></ToolButton>
        <span className="mx-1 h-5 w-px bg-line" />
        {views.map((v) => (
          <ToolButton key={v.id} label={v.label} onClick={() => setCameraView(v.id)} active={view === v.id && !autoRotate}>{v.icon}</ToolButton>
        ))}
        <ToolButton label="Auto-rotate" onClick={() => setAutoRotate(!autoRotate)} active={autoRotate}><Rotate3d className="h-4 w-4" /></ToolButton>
        {!compact && (
          <>
            <span className="mx-1 h-5 w-px bg-line" />
            <ToolButton label="Screenshot" onClick={downloadScreenshot}><Camera className="h-4 w-4" /></ToolButton>
            <ToolButton label="Save design" onClick={saveCurrentDesign}><Heart className="h-4 w-4" /></ToolButton>
            <ToolButton label="Share link" onClick={() => shareDesign()}><Share2 className="h-4 w-4" /></ToolButton>
          </>
        )}
        <ToolButton
          label="Reset cake"
          onClick={async () => {
            if (await confirmDialog({ title: "Reset this cake?", message: "All customisations will be cleared. You can still undo afterwards.", confirmLabel: "Reset", danger: true })) reset();
          }}
        >
          <RotateCcw className="h-4 w-4" />
        </ToolButton>
      </div>

      {/* status chips */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 hidden flex-col gap-1 text-[11px] text-muted sm:flex">
        <span className="glass rounded-full px-2.5 py-1">Drag to orbit · Scroll to zoom</span>
        {armed && <span className="rounded-full bg-accent px-2.5 py-1 font-semibold text-[#1a0f0b]">Click the cake to place</span>}
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 z-10 hidden sm:block">
        <span className="glass flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] text-muted"><Maximize2 className="h-3 w-3" /> {config.weightKg} kg · {config.tiers.length} tier{config.tiers.length > 1 ? "s" : ""}</span>
      </div>

      {/* inspector */}
      <div className="pointer-events-none absolute inset-x-3 bottom-12 z-20 flex justify-center sm:bottom-14 xl:justify-end">
        <AnimatePresence>{selected && <DecorationInspector key="inspector" />}</AnimatePresence>
      </div>

      <AnimatePresence>
        {dropping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-accent/10">
            <span className="glass-strong rounded-full px-4 py-2 text-sm font-semibold">Drop onto the cake ✨</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
