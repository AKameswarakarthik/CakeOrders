"use client";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useUI } from "@/store/appStore";

export function Toaster() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismiss);
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[min(92vw,360px)] flex-col gap-2 max-md:bottom-24">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = t.tone === "error" ? XCircle : t.tone === "success" ? CheckCircle2 : Info;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              className="glass-strong glow pointer-events-auto flex items-start gap-3 rounded-2xl p-3.5"
              role="status"
            >
              <Icon className={t.tone === "error" ? "mt-0.5 h-5 w-5 text-red-400" : t.tone === "success" ? "mt-0.5 h-5 w-5 text-emerald-400" : "mt-0.5 h-5 w-5 text-accent"} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.description && <p className="mt-0.5 text-xs text-muted">{t.description}</p>}
              </div>
              <button aria-label="Dismiss notification" onClick={() => dismiss(t.id)} className="text-muted hover:text-fg">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
