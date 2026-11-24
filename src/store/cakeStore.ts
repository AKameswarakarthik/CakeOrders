"use client";
/**
 * CakeConfigurationStore + DesignHistory.
 * Holds the single source of truth for the cake being designed, with undo/redo.
 */
import { create } from "zustand";
import type { CakeConfig, OccasionId, PlacedDecoration, ShapeId, TierConfig } from "@/types/cake";
import { createDecoration, createDefaultConfig, createTier, defaultRotation, wrapAngle } from "@/lib/cake/defaults";
import { deepClone, safeStorage, uid } from "@/lib/utils";
import { getDecoration } from "@/data/decorations";
import { MIN_WEIGHT_FOR_TIERS, SHAPES } from "@/data/catalog";

const HISTORY_LIMIT = 60;
const DRAFT_KEY = "cakeverse:draft";

export type CameraView = "free" | "front" | "top" | "side" | "iso";

export interface CakeState {
  config: CakeConfig;
  past: CakeConfig[];
  future: CakeConfig[];
  /** snapshot taken at the start of a transient (drag) interaction */
  transientBase: CakeConfig | null;

  selectedUid: string | null;
  activeTier: number | "all";
  armedDecoration: string | null;
  step: number;
  cameraView: CameraView;
  cameraNonce: number;
  autoRotate: boolean;
  /** cart item currently being edited (if any) */
  editingCartId: string | null;
  lastNotice: { text: string; at: number } | null;

  update: (mutator: (draft: CakeConfig) => void, opts?: { history?: boolean }) => void;
  load: (config: CakeConfig, opts?: { keepHistory?: boolean; editingCartId?: string | null }) => void;
  reset: (occasion?: OccasionId) => void;
  undo: () => void;
  redo: () => void;
  beginTransient: () => void;
  endTransient: () => void;

  setStep: (s: number) => void;
  setActiveTier: (t: number | "all") => void;
  setCameraView: (v: CameraView) => void;
  setAutoRotate: (v: boolean) => void;
  select: (uid: string | null) => void;
  arm: (decorationId: string | null) => void;
  notify: (text: string) => void;

  // domain actions
  setOccasion: (o: OccasionId) => void;
  setShape: (s: ShapeId) => void;
  setWeight: (kg: number) => void;
  setTierCount: (n: number) => void;
  updateTiers: (patch: Partial<TierConfig>) => void;
  addDecoration: (decorationId: string, placement?: Partial<PlacedDecoration>) => string | null;
  updateDecoration: (uid: string, patch: Partial<PlacedDecoration>, opts?: { history?: boolean }) => void;
  removeDecoration: (uid: string) => void;
  duplicateDecoration: (uid: string) => void;
  removeLastOf: (decorationId: string) => void;
}

const touch = (c: CakeConfig) => {
  c.updatedAt = Date.now();
  return c;
};

function loadDraft(): CakeConfig | null {
  const s = safeStorage();
  if (!s) return null;
  try {
    const raw = s.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as CakeConfig) : null;
  } catch {
    return null;
  }
}

export const useCakeStore = create<CakeState>((set, get) => ({
  config: createDefaultConfig("birthday"),
  past: [],
  future: [],
  transientBase: null,
  selectedUid: null,
  activeTier: "all",
  armedDecoration: null,
  step: 0,
  cameraView: "iso",
  cameraNonce: 0,
  autoRotate: false,
  editingCartId: null,
  lastNotice: null,

  update: (mutator, opts = {}) => {
    const { config, past, transientBase } = get();
    const next = deepClone(config);
    mutator(next);
    touch(next);
    const record = opts.history !== false && !transientBase;
    set({
      config: next,
      past: record ? [...past, config].slice(-HISTORY_LIMIT) : past,
      future: record ? [] : get().future,
    });
  },

  load: (config, opts = {}) =>
    set((s) => ({
      config: deepClone(config),
      past: opts.keepHistory ? [...s.past, s.config].slice(-HISTORY_LIMIT) : [],
      future: [],
      selectedUid: null,
      armedDecoration: null,
      activeTier: "all",
      editingCartId: opts.editingCartId ?? null,
      cameraNonce: s.cameraNonce + 1,
    })),

  reset: (occasion) => {
    const occ = occasion ?? get().config.occasion;
    set((s) => ({
      config: createDefaultConfig(occ),
      past: [...s.past, s.config].slice(-HISTORY_LIMIT),
      future: [],
      selectedUid: null,
      activeTier: "all",
      editingCartId: null,
    }));
  },

  undo: () => {
    const { past, config, future } = get();
    if (!past.length) return;
    const prev = past[past.length - 1];
    set({ config: prev, past: past.slice(0, -1), future: [config, ...future], selectedUid: null });
  },
  redo: () => {
    const { past, config, future } = get();
    if (!future.length) return;
    const [next, ...rest] = future;
    set({ config: next, past: [...past, config], future: rest, selectedUid: null });
  },

  beginTransient: () => set({ transientBase: get().config }),
  endTransient: () => {
    const { transientBase, past, config } = get();
    if (!transientBase) return;
    const changed = transientBase !== config;
    set({
      transientBase: null,
      past: changed ? [...past, transientBase].slice(-HISTORY_LIMIT) : past,
      future: changed ? [] : get().future,
    });
  },

  setStep: (step) => set({ step }),
  setActiveTier: (activeTier) => set({ activeTier }),
  setCameraView: (cameraView) => set((s) => ({ cameraView, cameraNonce: s.cameraNonce + 1 })),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  select: (selectedUid) => set({ selectedUid }),
  arm: (armedDecoration) => set({ armedDecoration }),
  notify: (text) => set({ lastNotice: { text, at: Date.now() } }),

  setOccasion: (o) => get().update((c) => void (c.occasion = o)),

  setShape: (shape) => {
    const def = SHAPES.find((s) => s.id === shape)!;
    get().update((c) => {
      c.shape = shape;
      if (c.tiers.length > def.maxTiers) {
        c.tiers = c.tiers.slice(0, def.maxTiers);
        c.decorations = c.decorations.filter((d) => d.tierIndex < def.maxTiers);
      }
      if (def.minTiers && c.tiers.length < def.minTiers) {
        while (c.tiers.length < def.minTiers) c.tiers.push({ ...createTier(c.tiers[0]), id: uid("t_") });
        c.weightKg = Math.max(c.weightKg, MIN_WEIGHT_FOR_TIERS[c.tiers.length]);
      }
      if (shape === "number" && !/^\d{1,2}$/.test(c.shapeText)) c.shapeText = "21";
      if (shape === "letter" && !/^[A-Za-z]{1,2}$/.test(c.shapeText)) c.shapeText = "A";
      // geometry changed: ask the scene to re-validate all top decorations
      c.decorations.forEach((d) => {
        if (d.surface === "top") d.pendingSnap = true;
      });
    });
  },

  setWeight: (kg) =>
    get().update((c) => {
      c.weightKg = Math.round(kg * 10) / 10;
      // drop tiers the weight can no longer support
      while (c.tiers.length > 1 && c.weightKg < MIN_WEIGHT_FOR_TIERS[c.tiers.length]) {
        c.tiers.pop();
        const n = c.tiers.length;
        c.decorations = c.decorations.map((d) => (d.tierIndex >= n ? { ...d, tierIndex: n - 1, pendingSnap: true } : d));
      }
      c.decorations.forEach((d) => d.surface === "top" && (d.pendingSnap = true));
    }),

  setTierCount: (n) => {
    const { config, notify } = get();
    const shape = SHAPES.find((s) => s.id === config.shape)!;
    const count = Math.min(Math.max(1, n), 5);
    if (count > shape.maxTiers) {
      notify(`${shape.name} cakes support ${shape.maxTiers} tier(s) — switched to Round.`);
    }
    get().update((c) => {
      if (count > shape.maxTiers) c.shape = count > 1 ? "round" : c.shape;
      if (shape.minTiers && count < shape.minTiers) c.shape = "round";
      while (c.tiers.length < count) {
        const last = c.tiers[c.tiers.length - 1];
        c.tiers.push({ ...last, id: uid("t_") });
      }
      if (c.tiers.length > count) {
        c.tiers = c.tiers.slice(0, count);
        c.decorations = c.decorations.map((d) => (d.tierIndex >= count ? { ...d, tierIndex: count - 1, pendingSnap: true } : d));
      }
      const minW = MIN_WEIGHT_FOR_TIERS[count];
      if (c.weightKg < minW) c.weightKg = minW;
      c.decorations.forEach((d) => d.surface === "top" && (d.pendingSnap = true));
    });
    const minW = MIN_WEIGHT_FOR_TIERS[count];
    if (config.weightKg < minW) notify(`Weight increased to ${minW} kg to support ${count} tiers.`);
  },

  updateTiers: (patch) => {
    const t = get().activeTier;
    get().update((c) => {
      c.tiers = c.tiers.map((tier, i) => (t === "all" || t === i ? { ...tier, ...patch } : tier));
      if (patch.sizeScale !== undefined) c.decorations.forEach((d) => d.surface === "top" && (d.pendingSnap = true));
    });
  },

  addDecoration: (decorationId, placement = {}) => {
    const def = getDecoration(decorationId);
    if (!def) return null;
    const { config, notify, activeTier } = get();
    const count = config.decorations.filter((d) => d.decorationId === decorationId).length;
    if (count >= def.maxQty) {
      notify(`Maximum ${def.maxQty} × ${def.name} per cake.`);
      return null;
    }
    const topTier = config.tiers.length - 1;
    const tierIndex = placement.tierIndex ?? (activeTier === "all" ? topTier : activeTier);
    let p: Partial<PlacedDecoration> = placement;
    if (placement.u === undefined) {
      // auto placement: spiral around the tier top
      const k = config.decorations.filter((d) => d.tierIndex === tierIndex && d.surface === "top").length;
      const golden = 2.399963;
      const r = def.heavy ? 0 : Math.min(0.8, 0.35 + 0.12 * Math.sqrt(k + 1));
      const u = Math.cos(k * golden) * r;
      const v = Math.sin(k * golden) * r;
      p = { ...placement, surface: "top", u, v, rotation: defaultRotation(decorationId, u, v), pendingSnap: true };
    }
    const deco = createDecoration(decorationId, { tierIndex, ...p });
    deco.rotation = wrapAngle(deco.rotation);
    get().update((c) => {
      c.decorations.push(deco);
    });
    set({ selectedUid: def.placement === "scatter" ? null : deco.uid });
    return deco.uid;
  },

  updateDecoration: (id, patch, opts) =>
    get().update((c) => {
      const p = patch.rotation !== undefined ? { ...patch, rotation: wrapAngle(patch.rotation) } : patch;
      c.decorations = c.decorations.map((d) => (d.uid === id ? { ...d, ...p } : d));
    }, opts),

  removeDecoration: (id) => {
    get().update((c) => {
      c.decorations = c.decorations.filter((d) => d.uid !== id);
    });
    if (get().selectedUid === id) set({ selectedUid: null });
  },

  duplicateDecoration: (id) => {
    const d = get().config.decorations.find((x) => x.uid === id);
    if (!d) return;
    const shift = d.surface === "top" ? { u: Math.min(0.9, d.u + 0.18), v: d.v + 0.1 } : { u: d.u + 0.4 };
    get().addDecoration(d.decorationId, { ...d, ...shift, uid: undefined, pendingSnap: d.surface === "top" } as Partial<PlacedDecoration>);
  },

  removeLastOf: (decorationId) => {
    const list = get().config.decorations.filter((d) => d.decorationId === decorationId);
    const last = list[list.length - 1];
    if (last) get().removeDecoration(last.uid);
  },
}));

/* ── Auto-save draft ───────────────────────────────────── */
let saveTimer: ReturnType<typeof setTimeout> | null = null;
if (typeof window !== "undefined") {
  useCakeStore.subscribe((s, prev) => {
    if (s.config === prev.config) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const st = safeStorage();
      try {
        st?.setItem(DRAFT_KEY, JSON.stringify(s.config));
      } catch {
        /* quota exceeded – ignore */
      }
    }, 600);
  });
}

export const restoreDraft = () => {
  const d = loadDraft();
  if (d) useCakeStore.getState().load(d);
  return !!d;
};

/** Registry so non-3D UI can request a screenshot from the live canvas. */
export const sceneBridge: {
  capture: (() => string | null) | null;
  dropAt: ((clientX: number, clientY: number, decorationId: string) => boolean) | null;
} = { capture: null, dropAt: null };
