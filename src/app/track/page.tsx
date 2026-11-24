"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Search } from "lucide-react";
import { useOrders, useUI } from "@/store/appStore";
import { STATUS_FLOW, simulatedStatus } from "@/lib/services/orderService";
import { CakeThumb } from "@/components/cart/CakeSummary";
import { cn, formatINR } from "@/lib/utils";

function Tracker() {
  const params = useSearchParams();
  const router = useRouter();
  const hydrated = useUI((s) => s.hydrated);
  const orders = useOrders((s) => s.orders);
  const [q, setQ] = useState(params.get("id") ?? "");
  const id = params.get("id");
  const order = orders.find((o) => o.id.toLowerCase() === (id ?? "").toLowerCase());
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 15000);
    return () => clearInterval(t);
  }, []);
  const step = order ? simulatedStatus(order) : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl">Track your order</h1>
      <form className="mt-6 flex gap-2" onSubmit={(e) => (e.preventDefault(), router.push(`/track?id=${encodeURIComponent(q.trim())}`))}>
        <input className="field font-mono uppercase" placeholder="CV-251124-ABCDE" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Order ID" />
        <button className="btn btn-primary px-5" type="submit"><Search className="h-4 w-4" /> Track</button>
      </form>

      {hydrated && id && !order && <p className="mt-6 rounded-2xl bg-red-500/10 p-4 text-sm text-red-400">No order found with ID “{id}”. Orders placed on this device appear below.</p>}

      {order && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass mt-8 rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm text-muted">{order.id}</p>
              <p className="font-display text-2xl">{STATUS_FLOW[step].label}</p>
              <p className="text-sm text-muted">{STATUS_FLOW[step].hint}</p>
            </div>
            <p className="text-sm text-muted">{order.fulfilment.date} · {order.fulfilment.slot}</p>
          </div>
          <ol className="mt-8 grid gap-4 sm:grid-cols-6">
            {STATUS_FLOW.map((s, i) => (
              <li key={s.id} className="flex items-center gap-3 sm:flex-col sm:text-center">
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 transition", i <= step ? "border-accent bg-accent text-[#1a0f0b]" : "border-line text-muted")}>
                  {i < step ? <Check className="h-5 w-5" /> : i === step ? <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.6 }} className="h-2.5 w-2.5 rounded-full bg-[#1a0f0b]" /> : <span className="text-xs">{i + 1}</span>}
                </span>
                <span className={cn("text-xs", i <= step ? "font-semibold" : "text-muted")}>{s.label}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-xs text-muted">Status is simulated: it advances one stage every 2 minutes after ordering.</p>
          <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5">
            {order.items.map((it) => (
              <div key={it.id} className="flex items-center gap-3">
                <CakeThumb config={it.config} className="h-12 w-12 rounded-xl" />
                <span className="text-sm">{it.config.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {hydrated && orders.length > 0 && (
        <section className="mt-10">
          <h2 className="font-semibold">Your recent orders</h2>
          <ul className="mt-3 space-y-2">
            {orders.slice(0, 8).map((o) => (
              <li key={o.id}>
                <Link href={`/track?id=${o.id}`} className="glass flex items-center justify-between rounded-2xl px-4 py-3 text-sm hover:border-accent/50">
                  <span className="font-mono">{o.id}</span>
                  <span className="text-muted">{STATUS_FLOW[simulatedStatus(o)].label}</span>
                  <span>{formatINR(o.totals.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}
