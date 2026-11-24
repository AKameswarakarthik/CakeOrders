"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Pencil, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import { confirmDialog, toast, useCart, useUI } from "@/store/appStore";
import { cakeSubtotal, evaluateCoupon, priceOrder } from "@/lib/pricing/PricingEngine";
import { COUPONS, PRICING } from "@/data/pricing";
import { CakeThumb, decorationGroups } from "@/components/cart/CakeSummary";
import { QtyStepper } from "@/components/builder/BasicSteps";
import { needsApproval } from "@/lib/cake/validation";
import { shareDesign } from "@/components/builder/actions";
import { formatINR } from "@/lib/utils";
import { SHAPES } from "@/data/catalog";

export default function CartPage() {
  const router = useRouter();
  const hydrated = useUI((s) => s.hydrated);
  const { items, coupon, remove, setQty, duplicate, setCoupon } = useCart();
  const [code, setCode] = useState("");
  const totals = useMemo(() => priceOrder(items, { coupon, delivery: "standard" }), [items, coupon]);

  if (!hydrated) return <div className="mx-auto mt-10 h-96 max-w-5xl skeleton rounded-3xl" />;

  if (!items.length)
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass glow mx-auto grid h-28 w-28 place-items-center rounded-full text-5xl">
          🛍️
        </motion.div>
        <h1 className="mt-6 font-display text-4xl">Your cart is empty</h1>
        <p className="mt-2 text-muted">Design a cake in 3D or start from one of our collections.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/studio?new=1" className="btn btn-primary px-6 py-3">Design My Cake</Link>
          <Link href="/collections" className="btn btn-ghost px-6 py-3">Collections</Link>
        </div>
      </div>
    );

  const apply = () => {
    const r = evaluateCoupon(code, totals.subtotal);
    if (r.ok) {
      setCoupon(code.trim().toUpperCase());
      toast({ title: `Coupon ${code.toUpperCase()} applied`, description: r.message, tone: "success" });
      setCode("");
    } else toast({ title: r.message || "Invalid coupon", tone: "error" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl">Your cart</h1>
      <p className="mt-1 text-muted">{items.length} customised cake{items.length > 1 ? "s" : ""}</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <ul className="space-y-4">
          <AnimatePresence initial={false}>
            {items.map((it) => {
              const each = Math.round(cakeSubtotal(it.config));
              const groups = decorationGroups(it.config);
              return (
                <motion.li key={it.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -40 }} className="glass flex flex-col gap-4 rounded-3xl p-4 sm:flex-row">
                  <CakeThumb config={it.config} className="h-40 w-full shrink-0 rounded-2xl sm:h-32 sm:w-32" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-display text-xl">{it.config.name}</h2>
                        <p className="text-sm text-muted">
                          {SHAPES.find((s) => s.id === it.config.shape)?.name} · {it.config.weightKg} kg · {it.config.tiers.length} tier{it.config.tiers.length > 1 ? "s" : ""}
                          {it.config.eggless ? " · Eggless" : ""}
                        </p>
                      </div>
                      <p className="font-semibold tabular-nums">{formatINR(each * it.quantity)}</p>
                    </div>
                    <p className="mt-1.5 line-clamp-1 text-xs text-muted">{groups.map((g) => `${g.def.emoji} ${g.def.name} ×${g.qty}`).join(" · ") || "No decorations"}</p>
                    {needsApproval(it.config) && <p className="mt-1.5 inline-block rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-500">Needs bakery approval</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <QtyStepper label="quantity" value={it.quantity} onDec={() => setQty(it.id, it.quantity - 1)} onInc={() => setQty(it.id, it.quantity + 1)} />
                      <Link href={`/studio?cart=${it.id}`} className="chip"><Pencil className="h-3.5 w-3.5" /> Edit</Link>
                      <button className="chip" onClick={() => (duplicate(it.id), toast({ title: "Duplicated", tone: "success" }))}><Copy className="h-3.5 w-3.5" /> Duplicate</button>
                      <button className="chip" onClick={() => shareDesign(it.config)}>Share</button>
                      <button
                        className="chip text-red-400"
                        onClick={async () => {
                          if (await confirmDialog({ title: "Remove this cake?", message: `“${it.config.name}” will be removed from your cart.`, confirmLabel: "Remove", danger: true })) remove(it.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
          <Link href="/studio?new=1" className="flex items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-line p-6 text-sm text-muted transition hover:border-accent hover:text-accent">
            + Design another cake
          </Link>
        </ul>

        <aside className="glass h-fit rounded-3xl p-5 lg:sticky lg:top-24">
          <h2 className="font-semibold">Order summary</h2>
          <div className="mt-4">
            {coupon ? (
              <div className="flex items-center justify-between rounded-2xl bg-emerald-500/10 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-emerald-500"><Tag className="h-4 w-4" /> {coupon}</span>
                <button onClick={() => setCoupon(null)} aria-label="Remove coupon"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input className="field py-2 uppercase" placeholder="Coupon code" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && apply()} aria-label="Coupon code" />
                <button className="btn btn-ghost px-4 text-sm" onClick={apply} disabled={!code.trim()}>Apply</button>
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-1">
              {COUPONS.map((c) => (
                <button key={c.code} className="rounded-full border border-dashed border-line px-2 py-0.5 text-[10px] text-muted hover:border-accent hover:text-accent" onClick={() => setCode(c.code)} title={c.description}>
                  {c.code}
                </button>
              ))}
            </div>
          </div>
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{formatINR(totals.subtotal)}</dd></div>
            {totals.discount > 0 && <div className="flex justify-between text-emerald-500"><dt>Discount</dt><dd className="tabular-nums">−{formatINR(totals.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted">Delivery (standard)</dt><dd className="tabular-nums">{totals.delivery ? formatINR(totals.delivery) : "Free"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">GST ({PRICING.gstRate * 100}%)</dt><dd className="tabular-nums">{formatINR(totals.tax)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatINR(totals.total)}</dd></div>
          </dl>
          {totals.subtotal < PRICING.delivery.freeAbove && <p className="mt-2 text-xs text-muted">Add {formatINR(PRICING.delivery.freeAbove - totals.subtotal)} more for free delivery.</p>}
          <button className="btn btn-primary mt-5 w-full py-3.5" onClick={() => router.push("/checkout")}>
            <ShoppingBag className="h-4 w-4" /> Proceed to checkout
          </button>
          <p className="mt-3 text-center text-[11px] text-muted">Delivery options & midnight slots at checkout</p>
        </aside>
      </div>
    </div>
  );
}
