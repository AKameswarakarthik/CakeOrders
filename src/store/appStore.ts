"use client";
/** Persistent app stores: cart, saved designs, orders, UI prefs. */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CakeConfig } from "@/types/cake";
import { deepClone, uid } from "@/lib/utils";

const storage = createJSONStorage(() => localStorage);

/* ── Cart ─────────────────────────────────────────────── */
export interface CartItem {
  id: string;
  config: CakeConfig;
  quantity: number;
  addedAt: number;
}

interface CartState {
  items: CartItem[];
  coupon: string | null;
  add: (config: CakeConfig) => string;
  replace: (id: string, config: CakeConfig) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  duplicate: (id: string) => void;
  setCoupon: (c: string | null) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      add: (config) => {
        const id = uid("ci_");
        set({ items: [...get().items, { id, config: { ...deepClone(config), id: uid("cake_") }, quantity: 1, addedAt: Date.now() }] });
        return id;
      },
      replace: (id, config) => set({ items: get().items.map((i) => (i.id === id ? { ...i, config: deepClone(config) } : i)) }),
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      setQty: (id, qty) => set({ items: get().items.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.min(10, qty)) } : i)) }),
      duplicate: (id) => {
        const it = get().items.find((i) => i.id === id);
        if (it) set({ items: [...get().items, { ...deepClone(it), id: uid("ci_"), config: { ...deepClone(it.config), id: uid("cake_"), name: it.config.name + " (copy)" } }] });
      },
      setCoupon: (coupon) => set({ coupon }),
      clear: () => set({ items: [], coupon: null }),
    }),
    { name: "cakeverse:cart", storage, skipHydration: true }
  )
);

/* ── Saved designs ────────────────────────────────────── */
interface SavedState {
  designs: CakeConfig[];
  save: (config: CakeConfig) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  rename: (id: string, name: string) => void;
}

export const useSaved = create<SavedState>()(
  persist(
    (set, get) => ({
      designs: [],
      save: (config) => {
        const c = deepClone(config);
        c.updatedAt = Date.now();
        const exists = get().designs.some((d) => d.id === c.id);
        set({ designs: exists ? get().designs.map((d) => (d.id === c.id ? c : d)) : [c, ...get().designs] });
      },
      remove: (id) => set({ designs: get().designs.filter((d) => d.id !== id) }),
      duplicate: (id) => {
        const d = get().designs.find((x) => x.id === id);
        if (d) set({ designs: [{ ...deepClone(d), id: uid("cake_"), name: d.name + " (copy)", createdAt: Date.now(), updatedAt: Date.now() }, ...get().designs] });
      },
      rename: (id, name) => set({ designs: get().designs.map((d) => (d.id === id ? { ...d, name } : d)) }),
    }),
    { name: "cakeverse:saved", storage, skipHydration: true }
  )
);

/* ── Orders ───────────────────────────────────────────── */
export type OrderStatus = "placed" | "confirmed" | "baking" | "decorating" | "out-for-delivery" | "delivered";

export interface Order {
  id: string;
  createdAt: number;
  items: CartItem[];
  customer: { name: string; phone: string; email: string };
  fulfilment: {
    mode: "standard" | "express" | "midnight" | "pickup";
    address?: string;
    pin?: string;
    date: string;
    slot: string;
    recipientName?: string;
    recipientPhone?: string;
    instructions?: string;
  };
  payment: string;
  totals: { subtotal: number; discount: number; delivery: number; tax: number; total: number };
  coupon?: string | null;
  needsApproval: boolean;
}

interface OrderState {
  orders: Order[];
  addOrder: (o: Order) => void;
}

export const useOrders = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (o) => set({ orders: [o, ...get().orders] }),
    }),
    { name: "cakeverse:orders", storage, skipHydration: true }
  )
);

/* ── UI prefs: theme, favourites, recent colours, profile ─ */
export interface Profile {
  name: string;
  phone: string;
  email: string;
  address: string;
  pin: string;
}

interface PrefsState {
  theme: "dark" | "light";
  favorites: string[];
  recentColors: string[];
  profile: Profile;
  setTheme: (t: "dark" | "light") => void;
  toggleFavorite: (id: string) => void;
  pushRecentColor: (c: string) => void;
  setProfile: (p: Partial<Profile>) => void;
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      favorites: [],
      recentColors: [],
      profile: { name: "", phone: "", email: "", address: "", pin: "" },
      setTheme: (theme) => set({ theme }),
      toggleFavorite: (id) => {
        const f = get().favorites;
        set({ favorites: f.includes(id) ? f.filter((x) => x !== id) : [...f, id] });
      },
      pushRecentColor: (c) => {
        const lc = c.toLowerCase();
        set({ recentColors: [lc, ...get().recentColors.filter((x) => x !== lc)].slice(0, 10) });
      },
      setProfile: (p) => set({ profile: { ...get().profile, ...p } }),
    }),
    { name: "cakeverse:prefs", storage, skipHydration: true }
  )
);

/* ── Toasts & confirm dialog (non-persistent) ─────────── */
export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone?: "success" | "error" | "info";
}

interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  resolve: (ok: boolean) => void;
}

interface UIState {
  toasts: Toast[];
  confirm: ConfirmRequest | null;
  hydrated: boolean;
  toast: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
  ask: (r: Omit<ConfirmRequest, "resolve">) => Promise<boolean>;
  closeConfirm: (ok: boolean) => void;
  setHydrated: () => void;
}

export const useUI = create<UIState>((set, get) => ({
  toasts: [],
  confirm: null,
  hydrated: false,
  toast: (t) => {
    const id = uid("toast_");
    set({ toasts: [...get().toasts, { ...t, id }].slice(-4) });
    setTimeout(() => get().dismiss(id), 3800);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  ask: (r) =>
    new Promise<boolean>((resolve) => {
      set({ confirm: { ...r, resolve } });
    }),
  closeConfirm: (ok) => {
    get().confirm?.resolve(ok);
    set({ confirm: null });
  },
  setHydrated: () => set({ hydrated: true }),
}));

export const toast = (t: Omit<Toast, "id">) => useUI.getState().toast(t);
export const confirmDialog = (r: Omit<ConfirmRequest, "resolve">) => useUI.getState().ask(r);
