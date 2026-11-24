"use client";
import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { useCart, useOrders, usePrefs, useSaved, useUI } from "@/store/appStore";
import { Toaster } from "./Toaster";
import { ConfirmDialog } from "./ConfirmDialog";

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = usePrefs((s) => s.theme);
  const setHydrated = useUI((s) => s.setHydrated);
  const hydrated = useUI((s) => s.hydrated);

  useEffect(() => {
    Promise.all([usePrefs.persist.rehydrate(), useCart.persist.rehydrate(), useSaved.persist.rehydrate(), useOrders.persist.rehydrate()]).finally(setHydrated);
  }, [setHydrated]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, hydrated]);

  return (
    <MotionConfig reducedMotion="user">
      {children}
      <Toaster />
      <ConfirmDialog />
    </MotionConfig>
  );
}
