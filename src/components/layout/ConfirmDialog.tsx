"use client";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useUI } from "@/store/appStore";

export function ConfirmDialog() {
  const req = useUI((s) => s.confirm);
  const close = useUI((s) => s.closeConfirm);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!req) return;
    btn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [req, close]);

  return (
    <AnimatePresence>
      {req && (
        <motion.div className="fixed inset-0 z-[95] grid place-items-center bg-black/50 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => close(false)}>
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            initial={{ scale: 0.92, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong glow w-full max-w-sm rounded-3xl p-6"
          >
            <div className="flex items-center gap-3">
              <span className={`grid h-10 w-10 place-items-center rounded-full ${req.danger ? "bg-red-500/15 text-red-400" : "bg-accent/15 text-accent"}`}>
                <AlertTriangle className="h-5 w-5" />
              </span>
              <h2 id="confirm-title" className="font-display text-xl">
                {req.title}
              </h2>
            </div>
            <p className="mt-3 text-sm text-muted">{req.message}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn btn-ghost px-4 py-2 text-sm" onClick={() => close(false)}>
                Cancel
              </button>
              <button ref={btn} className={`btn px-4 py-2 text-sm ${req.danger ? "bg-red-500 text-white" : "btn-primary"}`} onClick={() => close(true)}>
                {req.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
