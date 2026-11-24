"use client";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarDays, Check, Copy, MapPin, PackageCheck, ShieldCheck } from "lucide-react";
import { toast, useOrders, useUI } from "@/store/appStore";
import { CakeSpecs, CakeThumb } from "@/components/cart/CakeSummary";
import { Confetti } from "@/components/ui/Confetti";
import { formatINR } from "@/lib/utils";

function Confirmation() {
  const id = useSearchParams().get("id");
  const hydrated = useUI((s) => s.hydrated);
  const order = useOrders((s) => s.orders.find((o) => o.id === id));
  if (!hydrated) return <div className="mx-auto mt-10 h-96 max-w-3xl skeleton rounded-3xl" />;
  if (!order)
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Order not found</h1>
        <p className="mt-2 text-muted">Check your order ID or track it from the Track Order page.</p>
        <Link href="/track" className="btn btn-primary mt-6 px-6 py-3">Track an order</Link>
      </div>
    );
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Confetti />
      <div className="text-center">
        <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 12 }} className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-[#f4c7c3] via-[#e8a598] to-[#c9a14a] text-[#1a0f0b] shadow-2xl">
          <Check className="h-12 w-12" strokeWidth={3} />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 font-display text-4xl sm:text-5xl">
          Your cake is <span className="text-gradient italic">on its way</span> to the oven!
        </motion.h1>
        <p className="mt-3 text-muted">Thank you, {order.customer.name.split(" ")[0]}. A confirmation has been sent to {order.customer.email} (simulated).</p>
        <button
          onClick={() => (navigator.clipboard?.writeText(order.id), toast({ title: "Order ID copied", tone: "success" }))}
          className="chip glass mx-auto mt-5 font-mono text-sm"
          aria-label="Copy order ID"
        >
          {order.id} <Copy className="h-3.5 w-3.5" />
        </button>
      </div>

      {order.needsApproval && (
        <p className="mx-auto mt-6 flex max-w-xl items-start gap-2 rounded-2xl bg-amber-500/10 p-3 text-sm text-amber-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> Your design includes elements that need bakery approval. Our head chef will confirm within 2–4 hours.
        </p>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: CalendarDays, label: "Delivery", value: `${new Date(order.fulfilment.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · ${order.fulfilment.slot}` },
          { icon: MapPin, label: order.fulfilment.mode === "pickup" ? "Pickup" : "Address", value: order.fulfilment.address ?? "" },
          { icon: PackageCheck, label: "Paid via", value: `${order.payment.toUpperCase()} · ${formatINR(order.totals.total)}` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="glass rounded-3xl p-4">
            <Icon className="h-5 w-5 text-accent" />
            <p className="label mt-3">{label}</p>
            <p className="mt-1 text-sm">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {order.items.map((it) => (
          <div key={it.id} className="glass flex flex-col gap-5 rounded-3xl p-5 sm:flex-row">
            <CakeThumb config={it.config} className="h-44 w-full shrink-0 rounded-2xl sm:w-44" />
            <div className="flex-1">
              <h2 className="font-display text-2xl">{it.config.name} {it.quantity > 1 && <span className="text-base text-muted">×{it.quantity}</span>}</h2>
              <div className="mt-3">
                <CakeSpecs config={it.config} dense />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass mt-6 rounded-3xl p-5 text-sm">
        <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatINR(order.totals.subtotal)}</span></div>
        {order.totals.discount > 0 && <div className="flex justify-between text-emerald-500"><span>Discount {order.coupon && `(${order.coupon})`}</span><span>−{formatINR(order.totals.discount)}</span></div>}
        <div className="flex justify-between"><span className="text-muted">Delivery</span><span>{order.totals.delivery ? formatINR(order.totals.delivery) : "Free"}</span></div>
        <div className="flex justify-between"><span className="text-muted">GST</span><span>{formatINR(order.totals.tax)}</span></div>
        <div className="mt-2 flex justify-between border-t border-line pt-2 text-lg font-semibold"><span>Total paid</span><span>{formatINR(order.totals.total)}</span></div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={`/track?id=${order.id}`} className="btn btn-primary px-6 py-3">Track order</Link>
        <Link href="/studio?new=1" className="btn btn-ghost px-6 py-3">Design another cake</Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <Confirmation />
    </Suspense>
  );
}
