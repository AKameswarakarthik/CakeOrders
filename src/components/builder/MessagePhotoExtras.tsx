"use client";
/** MessageEditor, PhotoUploader and ExtrasPanel steps. */
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { useCakeStore } from "@/store/cakeStore";
import { toast } from "@/store/appStore";
import { BASE_PLATES, BORDERS, DRIP_COLORS, FILLINGS, MESSAGE_FONTS, PACKAGING } from "@/data/catalog";
import { PRICING } from "@/data/pricing";
import { DEFAULT_PHOTO } from "@/lib/cake/defaults";
import type { CakeMessage, PhotoConfig } from "@/types/cake";
import { autoFontFor } from "@/lib/messageFonts";
import { cn, formatINR } from "@/lib/utils";
import { OptionCard, StepHeader, Toggle } from "./shared";

const MSG_COLORS = ["#4a2a1c", "#fffaf3", "#d4af37", "#c8102e", "#b76e79", "#1e2a5a", "#f4a6c1", "#1b1b1b"];
const FONT_CSS: Record<CakeMessage["font"], string> = {
  script: "var(--font-script)",
  elegant: "var(--font-elegant)",
  modern: "var(--font-body)",
  playful: "var(--font-playful)",
  devanagari: "var(--font-devanagari)",
  telugu: "var(--font-telugu)",
};
const SAMPLES = [
  { label: "English", text: "Happy Birthday" },
  { label: "हिन्दी", text: "जन्मदिन मुबारक" },
  { label: "తెలుగు", text: "పుట్టినరోజు శుభాకాంక్షలు" },
];

export function MessageEditor() {
  const m = useCakeStore((s) => s.config.message);
  const shape = useCakeStore((s) => s.config.shape);
  const update = useCakeStore((s) => s.update);
  const set = (patch: Partial<CakeMessage>, history = true) => update((c) => void (c.message = { ...c.message, ...patch }), { history });
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [text, setText] = useState(m.text);
  useEffect(() => setText(m.text), [m.text]);

  const onText = (v: string) => {
    setText(v);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      const font = autoFontFor(v, m.font);
      set({ text: v, font });
    }, 250);
  };

  return (
    <div>
      <StepHeader title="Personalised message" subtitle="Rendered directly on the 3D cake. Supports English, Hindi & Telugu." />
      <label className="label" htmlFor="msg">Message</label>
      <textarea id="msg" className="field mt-1.5 text-lg" rows={2} maxLength={48} value={text} onChange={(e) => onText(e.target.value)} placeholder="Happy Birthday Aanya!" style={{ fontFamily: FONT_CSS[autoFontFor(text, m.font)] }} />
      <div className="mt-1.5 flex items-center justify-between">
        <div className="flex gap-1.5">
          {SAMPLES.map((s) => (
            <button key={s.label} type="button" className="chip text-[11px]" onClick={() => onText(s.text)}>{s.label}</button>
          ))}
        </div>
        <span className="text-[11px] text-muted">{text.length}/48</span>
      </div>

      <p className="label mb-2 mt-5">Font</p>
      <div className="grid grid-cols-3 gap-2">
        {MESSAGE_FONTS.map((f) => (
          <OptionCard key={f.id} active={m.font === f.id} onClick={() => set({ font: f.id })} className="py-2.5 text-center">
            <span className="block truncate text-lg" style={{ fontFamily: FONT_CSS[f.id] }}>{f.id === "devanagari" ? "नमस्ते" : f.id === "telugu" ? "నమస్తే" : "Aa Bb"}</span>
            <span className="block text-[10px] text-muted">{f.name}</span>
          </OptionCard>
        ))}
      </div>

      <p className="label mb-2 mt-5">Lettering</p>
      <div className="grid grid-cols-3 gap-2">
        {(["chocolate", "fondant", "icing"] as const).map((mat) => (
          <OptionCard key={mat} active={m.material === mat} onClick={() => set({ material: mat })} className="py-2.5 text-center">
            <span className="block text-sm font-semibold capitalize">{mat}</span>
            <span className="text-[10px] text-muted">{PRICING.message[mat] ? `+${formatINR(PRICING.message[mat])}` : "Included"}</span>
          </OptionCard>
        ))}
      </div>

      <p className="label mb-2 mt-5">Placement</p>
      <div className="grid grid-cols-2 gap-2">
        {([
          ["top-center", "Top centre"],
          ["top-front", "Top front"],
          ["side-front", "Front side"],
          ["plaque", `Chocolate plaque (+${formatINR(PRICING.message.plaque)})`],
        ] as const).map(([id, label]) => (
          <OptionCard key={id} active={m.position === id} onClick={() => set({ position: id })} className="py-2.5 text-sm">
            {label}
          </OptionCard>
        ))}
      </div>
      {(shape === "number" || shape === "letter") && m.position !== "plaque" && <p className="mt-2 text-xs text-muted">On number/letter cakes the message is placed on a plaque in front of the cake.</p>}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="label mb-2">Text colour</p>
          <div className="flex flex-wrap items-center gap-2">
            {MSG_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => set({ color: c })} aria-label={`Text colour ${c}`} className={cn("h-7 w-7 rounded-full border-2", m.color === c ? "border-accent ring-2 ring-accent/40" : "border-white/20")} style={{ background: c }} />
            ))}
            <label className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-line" title="Custom colour">
              <input type="color" value={m.color} onChange={(e) => set({ color: e.target.value }, false)} className="absolute inset-0 opacity-0" aria-label="Custom text colour" />
            </label>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="msg-size">Text size</label>
            <span className="text-xs text-muted">{Math.round(m.size * 100)}%</span>
          </div>
          <input id="msg-size" type="range" className="range mt-3" min={0.5} max={1.5} step={0.05} value={m.size} onChange={(e) => set({ size: parseFloat(e.target.value) }, false)} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <OptionCard active={!m.curved} onClick={() => set({ curved: false })} className="py-2.5 text-center text-sm">Straight text</OptionCard>
        <OptionCard active={m.curved} onClick={() => set({ curved: true })} className="py-2.5 text-center text-sm">Curved text <span className="text-[10px] text-muted">+{formatINR(PRICING.message.curved)}</span></OptionCard>
      </div>
      {m.text && (
        <button type="button" className="mt-4 text-xs text-muted underline-offset-2 hover:text-accent hover:underline" onClick={() => set({ text: "" })}>
          Remove message
        </button>
      )}
    </div>
  );
}

/** Downscale uploaded photos to keep history & localStorage light. */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const max = 900;
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function PhotoUploader() {
  const photo = useCakeStore((s) => s.config.photo);
  const shape = useCakeStore((s) => s.config.shape);
  const update = useCakeStore((s) => s.update);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cropRef = useRef<HTMLDivElement>(null);
  const pan = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const set = (patch: Partial<PhotoConfig>, history = true) => update((c) => void (c.photo = { ...c.photo, ...patch }), { history });

  const onFile = async (f?: File | null) => {
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) return toast({ title: "Unsupported file", description: "Upload a JPG, PNG or WebP image.", tone: "error" });
    if (f.size > 12 * 1024 * 1024) return toast({ title: "Image too large", description: "Maximum 12 MB.", tone: "error" });
    try {
      const dataUrl = await compressImage(f);
      set({ ...DEFAULT_PHOTO, dataUrl });
      toast({ title: "Photo added", description: "Edible print preview is on the cake.", tone: "success" });
    } catch {
      toast({ title: "Couldn't read that image", tone: "error" });
    }
  };

  const unsupported = shape === "number" || shape === "letter";

  return (
    <div>
      <StepHeader title="Photo cake" subtitle={`Edible photo print on the top tier · +${formatINR(PRICING.photoPrint)}`} />
      {unsupported && <p className="mb-3 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-500">Photo prints aren&apos;t available on number/letter shapes. Switch to a flat-top shape to preview.</p>}
      {!photo.dataUrl ? (
        <div
          onDragOver={(e) => (e.preventDefault(), setDrag(true))}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => (e.preventDefault(), setDrag(false), onFile(e.dataTransfer.files?.[0]))}
          className={cn("grid place-items-center rounded-3xl border-2 border-dashed p-10 text-center transition", drag ? "border-accent bg-accent/10" : "border-line")}
        >
          <ImagePlus className="h-10 w-10 text-accent" />
          <p className="mt-3 font-semibold">Drop a photo here</p>
          <p className="text-xs text-muted">JPG, PNG or WebP · up to 12 MB</p>
          <button type="button" className="btn btn-primary mt-4 px-5 py-2 text-sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Upload photo
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
      ) : (
        <div className="space-y-4">
          <div
            ref={cropRef}
            className={cn("relative mx-auto aspect-square w-56 cursor-move touch-none overflow-hidden border-4 border-cream shadow-xl", photo.shape === "circle" ? "rounded-full" : "rounded-3xl")}
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              pan.current = { x: e.clientX, y: e.clientY, ox: photo.offsetX, oy: photo.offsetY };
            }}
            onPointerMove={(e) => {
              if (!pan.current) return;
              const dx = (e.clientX - pan.current.x) / 112;
              const dy = (e.clientY - pan.current.y) / 112;
              set({ offsetX: Math.max(-1, Math.min(1, pan.current.ox - dx)), offsetY: Math.max(-1, Math.min(1, pan.current.oy - dy)) }, false);
            }}
            onPointerUp={() => (pan.current = null)}
            aria-label="Drag to reposition the photo crop"
            role="img"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.dataUrl}
              alt="Uploaded cake photo"
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              style={{ transform: `scale(${photo.zoom})`, objectPosition: `${50 + photo.offsetX * 50}% ${50 + photo.offsetY * 50}%` }}
            />
          </div>
          <p className="text-center text-xs text-muted">Drag the image to crop · edible-ink preview</p>
          <div className="grid grid-cols-2 gap-2">
            <OptionCard active={photo.shape === "circle"} onClick={() => set({ shape: "circle" })} className="py-2 text-center text-sm">Circle</OptionCard>
            <OptionCard active={photo.shape === "rect"} onClick={() => set({ shape: "rect" })} className="py-2 text-center text-sm">Rectangle</OptionCard>
          </div>
          {([
            ["zoom", "Crop zoom", 1, 3, 0.05],
            ["scale", "Size on cake", 0.3, 0.9, 0.01],
            ["posX", "Position left / right", -0.4, 0.4, 0.01],
            ["posY", "Position back / front", -0.4, 0.4, 0.01],
          ] as const).map(([k, label, min, max, step]) => (
            <div key={k}>
              <div className="flex justify-between">
                <label className="label" htmlFor={`photo-${k}`}>{label}</label>
                <span className="text-xs text-muted">{photo[k].toFixed(2)}</span>
              </div>
              <input id={`photo-${k}`} type="range" className="range mt-2" min={min} max={max} step={step} value={photo[k]} onChange={(e) => set({ [k]: parseFloat(e.target.value) } as Partial<PhotoConfig>, false)} />
            </div>
          ))}
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost flex-1 py-2 text-sm" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Replace
            </button>
            <button type="button" className="btn btn-ghost flex-1 py-2 text-sm text-red-400" onClick={() => set({ ...DEFAULT_PHOTO })}>
              <Trash2 className="h-4 w-4" /> Remove
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
        </div>
      )}
    </div>
  );
}

export function ExtrasPanel() {
  const e = useCakeStore((s) => s.config.extras);
  const update = useCakeStore((s) => s.update);
  const set = (patch: Partial<typeof e>, history = true) => update((c) => void (c.extras = { ...c.extras, ...patch }), { history });
  return (
    <div className="space-y-6">
      <StepHeader title="Finishing touches" subtitle="Drips, fillings, borders, presentation & instructions." />
      <section>
        <p className="label mb-2">Chocolate drip (top tier)</p>
        <div className="grid grid-cols-3 gap-2">
          {(["none", "dark", "white", "gold", "caramel", "pink"] as const).map((d) => (
            <OptionCard key={d} active={e.dripStyle === d} onClick={() => set({ dripStyle: d })} className="flex items-center gap-2 py-2">
              <span className="h-5 w-5 rounded-full border border-white/20" style={{ background: d === "none" ? "transparent" : DRIP_COLORS[d] }} />
              <span className="text-xs font-semibold capitalize">{d}</span>
            </OptionCard>
          ))}
        </div>
      </section>
      <section>
        <p className="label mb-2">Filling</p>
        <select className="field" value={e.filling} onChange={(ev) => set({ filling: ev.target.value })} aria-label="Cake filling">
          {FILLINGS.map((f) => (
            <option key={f.id} value={f.id}>{f.name}{f.price ? ` (+${formatINR(f.price)}/kg)` : ""}</option>
          ))}
        </select>
      </section>
      <section className="grid gap-2 sm:grid-cols-2">
        <Toggle checked={e.extraCream} onChange={(v) => set({ extraCream: v })} label="Extra cream" hint={`+${formatINR(PRICING.extraCream)}`} />
        <Toggle checked={e.chocolateCoating} onChange={(v) => set({ chocolateCoating: v })} label="Chocolate coating" hint={`Crumb-coat layer · +${formatINR(PRICING.chocolateCoating)}`} />
      </section>
      <section>
        <p className="label mb-2">Decorative border</p>
        <div className="grid grid-cols-3 gap-2">
          {BORDERS.map((b) => (
            <OptionCard key={b.id} active={e.border === b.id} onClick={() => set({ border: b.id })} className="py-2 text-center text-xs font-semibold">
              {b.name}
            </OptionCard>
          ))}
        </div>
        {e.border !== "none" && (
          <div className="mt-2 flex gap-2">
            {["#fffaf3", "#d4af37", "#c0c0c0", "#f4a6c1", "#4a2a1c"].map((c) => (
              <button key={c} onClick={() => set({ borderColor: c })} aria-label={`Border colour ${c}`} className={cn("h-7 w-7 rounded-full border-2", e.borderColor === c ? "border-accent" : "border-white/20")} style={{ background: c }} />
            ))}
          </div>
        )}
      </section>
      <section>
        <p className="label mb-2">Cake base</p>
        <div className="grid grid-cols-3 gap-2">
          {BASE_PLATES.map((b) => (
            <OptionCard key={b.id} active={e.basePlate === b.id} onClick={() => set({ basePlate: b.id })} className="flex items-center gap-2 py-2">
              <span className="h-5 w-5 rounded-full" style={{ background: b.color }} />
              <span className="text-xs font-semibold">{b.name}</span>
            </OptionCard>
          ))}
        </div>
      </section>
      <section>
        <p className="label mb-2">Packaging</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {PACKAGING.map((p) => (
            <OptionCard key={p.id} active={e.packaging === p.id} onClick={() => set({ packaging: p.id })} className="py-2.5">
              <span className="block text-sm font-semibold">{p.name}</span>
              <span className="block text-[11px] text-muted">{p.note} · {PRICING.packaging[p.id] ? `+${formatINR(PRICING.packaging[p.id])}` : "Free"}</span>
            </OptionCard>
          ))}
        </div>
      </section>
      <section>
        <label className="label" htmlFor="gift">Gift card message (+{formatINR(PRICING.giftMessage)})</label>
        <textarea id="gift" className="field mt-1.5" rows={2} maxLength={200} value={e.giftMessage} onChange={(ev) => set({ giftMessage: ev.target.value }, false)} placeholder="A handwritten card delivered with your cake" />
      </section>
      <section>
        <label className="label" htmlFor="instructions">Special instructions</label>
        <textarea id="instructions" className="field mt-1.5" rows={3} maxLength={400} value={e.specialInstructions} onChange={(ev) => set({ specialInstructions: ev.target.value }, false)} placeholder="Allergies, less sugar, colour references…" />
      </section>
    </div>
  );
}
