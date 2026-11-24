"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Pencil, Share2, ShoppingBag, Trash2 } from "lucide-react";
import { confirmDialog, toast, useCart, useSaved, useUI } from "@/store/appStore";
import { CakeThumb } from "@/components/cart/CakeSummary";
import { cakeSubtotal } from "@/lib/pricing/PricingEngine";
import { shareDesign } from "@/components/builder/actions";
import { formatINR } from "@/lib/utils";
import { getOccasion } from "@/data/occasions";

export default function SavedPage() {
  const hydrated = useUI((s) => s.hydrated);
  const { designs, remove, duplicate } = useSaved();
  if (!hydrated) return <div className="mx-auto mt-10 h-96 max-w-6xl skeleton rounded-3xl" />;
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl">Saved designs</h1>
      <p className="mt-1 text-muted">Stored on this device. Open any design to keep editing.</p>
      {designs.length === 0 ? (
        <div className="mt-12 rounded-3xl border-2 border-dashed border-line p-14 text-center">
          <div className="text-5xl">💝</div>
          <p className="mt-4 font-semibold">No saved designs yet</p>
          <p className="mt-1 text-sm text-muted">Tap the heart in the studio toolbar to save a design.</p>
          <Link href="/studio?new=1" className="btn btn-primary mt-6 px-6 py-3">Start designing</Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {designs.map((d) => (
              <motion.li key={d.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass overflow-hidden rounded-3xl">
                <CakeThumb config={d} className="aspect-[4/3] w-full" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-xl">{d.name}</h2>
                      <p className="text-xs text-muted">{getOccasion(d.occasion).name} · {d.weightKg} kg · saved {new Date(d.updatedAt).toLocaleDateString("en-IN")}</p>
                    </div>
                    <span className="shrink-0 font-semibold">{formatINR(cakeSubtotal(d) * 1.05)}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/studio?saved=${d.id}`} className="chip"><Pencil className="h-3.5 w-3.5" /> Edit</Link>
                    <button className="chip" onClick={() => (useCart.getState().add(d), toast({ title: "Added to cart", tone: "success" }))}><ShoppingBag className="h-3.5 w-3.5" /> Cart</button>
                    <button className="chip" onClick={() => duplicate(d.id)}><Copy className="h-3.5 w-3.5" /> Duplicate</button>
                    <button className="chip" onClick={() => shareDesign(d)}><Share2 className="h-3.5 w-3.5" /> Share</button>
                    <button
                      className="chip text-red-400"
                      onClick={async () => {
                        if (await confirmDialog({ title: "Delete design?", message: `“${d.name}” will be permanently removed from this device.`, confirmLabel: "Delete", danger: true })) remove(d.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
