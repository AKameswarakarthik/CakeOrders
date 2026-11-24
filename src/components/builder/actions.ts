"use client";
/** Shared design actions used by the studio, review and AI pages. */
import { sceneBridge, useCakeStore } from "@/store/cakeStore";
import { toast, useCart, useSaved } from "@/store/appStore";
import { shareUrl } from "@/lib/services/share";
import { hasBlockingErrors, validateDesign } from "@/lib/cake/validation";
import type { CakeConfig } from "@/types/cake";

export function captureThumbnail(): string | null {
  return sceneBridge.capture?.() ?? null;
}

export function currentWithThumbnail(): CakeConfig {
  const c = useCakeStore.getState().config;
  const thumb = captureThumbnail();
  return thumb ? { ...c, thumbnail: thumb } : c;
}

export function saveCurrentDesign() {
  const cfg = currentWithThumbnail();
  useSaved.getState().save(cfg);
  useCakeStore.getState().update((c) => void (c.thumbnail = cfg.thumbnail), { history: false });
  toast({ title: "Design saved", description: `“${cfg.name}” is in your saved designs.`, tone: "success" });
}

export function addCurrentToCart(): boolean {
  const st = useCakeStore.getState();
  if (hasBlockingErrors(st.config)) {
    const err = validateDesign(st.config).find((w) => w.level === "error");
    toast({ title: "Please fix your design first", description: err?.message, tone: "error" });
    return false;
  }
  const cfg = currentWithThumbnail();
  if (st.editingCartId && useCart.getState().items.some((i) => i.id === st.editingCartId)) {
    useCart.getState().replace(st.editingCartId, cfg);
    toast({ title: "Cart item updated", tone: "success" });
  } else {
    useCart.getState().add(cfg);
    toast({ title: "Added to cart", description: cfg.name, tone: "success" });
  }
  return true;
}

export async function shareDesign(config?: CakeConfig) {
  const url = shareUrl(config ?? useCakeStore.getState().config);
  try {
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      await navigator.share({ title: "My CakeVerse design", url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast({ title: "Share link copied", description: "Anyone with the link can open this design in the studio.", tone: "success" });
  } catch {
    window.prompt("Copy this link", url);
  }
}

export function downloadScreenshot() {
  const data = sceneBridge.capture?.();
  if (!data) return toast({ title: "Preview not ready", tone: "error" });
  const a = document.createElement("a");
  a.href = data;
  a.download = `${useCakeStore.getState().config.name.replace(/\s+/g, "-").toLowerCase()}.jpg`;
  a.click();
  toast({ title: "Screenshot captured", tone: "success" });
}
