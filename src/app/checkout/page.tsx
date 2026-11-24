"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Banknote, CreditCard, Gift, Loader2, Lock, MapPin, Moon, QrCode, Store, Truck, Wallet, Zap } from "lucide-react";
import { toast, useCart, useOrders, usePrefs, useUI, type Order } from "@/store/appStore";
import { priceOrder } from "@/lib/pricing/PricingEngine";
import { DELIVERY_SLOTS, PRICING } from "@/data/pricing";
import { checkPincode, generateOrderId, submitOrder } from "@/lib/services/orderService";
import { needsApproval } from "@/lib/cake/validation";
import { CakeThumb } from "@/components/cart/CakeSummary";
import { cn, formatINR } from "@/lib/utils";

const today = () => new Date().toISOString().slice(0, 10);

const schema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name"),
    phone: z.string().trim().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
    email: z.string().trim().email("Enter a valid email"),
    mode: z.enum(["standard", "express", "midnight", "pickup"]),
    address: z.string().trim().optional(),
    pin: z.string().trim().optional(),
    store: z.string().optional(),
    date: z.string().refine((d) => d >= today(), "Choose today or a future date"),
    slot: z.string().min(1, "Choose a time slot"),
    gift: z.boolean(),
    recipientName: z.string().trim().optional(),
    recipientPhone: z.string().trim().optional(),
    instructions: z.string().max(300).optional(),
    payment: z.enum(["upi", "credit", "debit", "cod", "wallet"]),
  })
  .superRefine((v, ctx) => {
    if (v.mode !== "pickup") {
      if (!v.address || v.address.length < 10) ctx.addIssue({ code: "custom", path: ["address"], message: "Enter the full delivery address" });
      if (!v.pin || !/^\d{6}$/.test(v.pin)) ctx.addIssue({ code: "custom", path: ["pin"], message: "Enter a 6-digit PIN code" });
    } else if (!v.store) ctx.addIssue({ code: "custom", path: ["store"], message: "Choose a pickup store" });
    if (v.mode === "midnight" && !v.slot.includes("Midnight")) ctx.addIssue({ code: "custom", path: ["slot"], message: "Midnight delivery uses the 23:30 – 00:30 slot" });
    if (v.gift && (!v.recipientName || v.recipientName.length < 2)) ctx.addIssue({ code: "custom", path: ["recipientName"], message: "Enter the recipient's name" });
    if (v.gift && v.recipientPhone && !/^(\+91[\s-]?)?[6-9]\d{9}$/.test(v.recipientPhone)) ctx.addIssue({ code: "custom", path: ["recipientPhone"], message: "Enter a valid mobile number" });
  });

type FormValues = z.infer<typeof schema>;

const STORES = ["Jubilee Hills, Hyderabad", "Indiranagar, Bengaluru", "Bandra West, Mumbai", "Hauz Khas, New Delhi", "Anna Nagar, Chennai"];

function Field({ label, error, children, id }: { label: string; error?: string; children: React.ReactNode; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-red-400" role="alert">{error}</p>}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const hydrated = useUI((s) => s.hydrated);
  const { items, coupon, clear } = useCart();
  const profile = usePrefs((s) => s.profile);
  const addOrder = useOrders((s) => s.addOrder);
  const [pinMsg, setPinMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const [placing, setPlacing] = useState(false);

  const { register, handleSubmit, control, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", email: "", mode: "standard", address: "", pin: "", store: "", date: today(), slot: DELIVERY_SLOTS[2], gift: false, payment: "upi", instructions: "", recipientName: "", recipientPhone: "" },
  });

  useEffect(() => {
    if (hydrated && profile.name) reset((v) => ({ ...v, name: profile.name, phone: profile.phone, email: profile.email, address: profile.address, pin: profile.pin }));
  }, [hydrated, profile, reset]);

  const mode = useWatch({ control, name: "mode" });
  const gift = useWatch({ control, name: "gift" });
  const pin = useWatch({ control, name: "pin" });
  const payment = useWatch({ control, name: "payment" });

  useEffect(() => {
    if (mode === "midnight") setValue("slot", DELIVERY_SLOTS[4]);
    else setValue("slot", DELIVERY_SLOTS[2]);
  }, [mode, setValue]);

  useEffect(() => {
    if (!pin || pin.length !== 6) return setPinMsg(null);
    let alive = true;
    checkPincode(pin).then((r) => alive && setPinMsg(r));
    return () => {
      alive = false;
    };
  }, [pin]);

  const totals = useMemo(() => priceOrder(items, { coupon, delivery: mode }), [items, coupon, mode]);

  if (!hydrated) return <div className="mx-auto mt-10 h-96 max-w-5xl skeleton rounded-3xl" />;
  if (!items.length && !placing)
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Nothing to check out</h1>
        <Link href="/studio?new=1" className="btn btn-primary mt-6 px-6 py-3">Design a cake</Link>
      </div>
    );

  const onSubmit = async (v: FormValues) => {
    if (v.mode !== "pickup" && pinMsg && !pinMsg.ok) return toast({ title: "We can't deliver to this PIN", description: "Choose store pickup instead.", tone: "error" });
    setPlacing(true);
    const order: Order = {
      id: generateOrderId(),
      createdAt: Date.now(),
      items,
      customer: { name: v.name, phone: v.phone, email: v.email },
      fulfilment: {
        mode: v.mode,
        address: v.mode === "pickup" ? `Pickup: ${v.store}` : v.address,
        pin: v.pin,
        date: v.date,
        slot: v.slot,
        recipientName: v.gift ? v.recipientName : undefined,
        recipientPhone: v.gift ? v.recipientPhone : undefined,
        instructions: v.instructions,
      },
      payment: v.payment,
      totals: { subtotal: totals.subtotal, discount: totals.discount, delivery: totals.delivery, tax: totals.tax, total: totals.total },
      coupon,
      needsApproval: items.some((i) => needsApproval(i.config)),
    };
    try {
      await submitOrder(order);
      addOrder(order);
      usePrefs.getState().setProfile({ name: v.name, phone: v.phone, email: v.email, ...(v.mode !== "pickup" ? { address: v.address ?? "", pin: v.pin ?? "" } : {}) });
      router.push(`/order-confirmation?id=${order.id}`);
      clear();
    } catch {
      setPlacing(false);
      toast({ title: "Payment failed (simulated)", description: "Please try again.", tone: "error" });
    }
  };

  const modes = [
    { id: "standard", label: "Standard", sub: totals.subtotal >= PRICING.delivery.freeAbove ? "Free" : formatINR(PRICING.delivery.standard), icon: Truck },
    { id: "express", label: "Express (3 hrs)", sub: formatINR(PRICING.delivery.express), icon: Zap },
    { id: "midnight", label: "Midnight", sub: coupon === "MIDNIGHT" ? "Free" : formatINR(PRICING.delivery.midnight), icon: Moon },
    { id: "pickup", label: "Store pickup", sub: "Free", icon: Store },
  ] as const;
  const pays = [
    { id: "upi", label: "UPI", icon: QrCode },
    { id: "credit", label: "Credit card", icon: CreditCard },
    { id: "debit", label: "Debit card", icon: CreditCard },
    { id: "wallet", label: "Wallets", icon: Wallet },
    { id: "cod", label: "Cash on delivery", icon: Banknote },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl">Checkout</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]" noValidate>
        <div className="space-y-6">
          <section className="glass rounded-3xl p-5 sm:p-6">
            <h2 className="mb-4 font-semibold">1. Your details</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field id="name" label="Full name" error={errors.name?.message}><input id="name" className="field" autoComplete="name" {...register("name")} /></Field>
              <Field id="phone" label="Mobile number" error={errors.phone?.message}><input id="phone" className="field" inputMode="tel" autoComplete="tel" placeholder="98765 43210" {...register("phone")} /></Field>
              <Field id="email" label="Email" error={errors.email?.message}><input id="email" type="email" className="field" autoComplete="email" {...register("email")} /></Field>
            </div>
          </section>

          <section className="glass rounded-3xl p-5 sm:p-6">
            <h2 className="mb-4 font-semibold">2. Delivery</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Delivery mode">
              {modes.map(({ id, label, sub, icon: Icon }) => (
                <label key={id} className={cn("cursor-pointer rounded-2xl border p-3 transition", mode === id ? "border-accent bg-accent/10" : "border-line hover:border-accent/50")}>
                  <input type="radio" value={id} className="sr-only" {...register("mode")} />
                  <Icon className="h-5 w-5 text-accent" />
                  <span className="mt-2 block text-sm font-semibold">{label}</span>
                  <span className="text-xs text-muted">{sub}</span>
                </label>
              ))}
            </div>
            {mode !== "pickup" ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_180px]">
                <Field id="address" label="Delivery address" error={errors.address?.message}>
                  <textarea id="address" rows={2} className="field" autoComplete="street-address" placeholder="Flat, building, street, area, city" {...register("address")} />
                </Field>
                <Field id="pin" label="PIN code" error={errors.pin?.message}>
                  <input id="pin" className="field" inputMode="numeric" maxLength={6} autoComplete="postal-code" {...register("pin")} />
                  {pinMsg && <p className={cn("mt-1 flex items-center gap-1 text-[11px]", pinMsg.ok ? "text-emerald-500" : "text-amber-500")}><MapPin className="h-3 w-3" /> {pinMsg.message}</p>}
                </Field>
              </div>
            ) : (
              <div className="mt-4">
                <Field id="store" label="Pickup store" error={errors.store?.message}>
                  <select id="store" className="field" {...register("store")}>
                    <option value="">Select a store…</option>
                    {STORES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field id="date" label="Delivery date" error={errors.date?.message}><input id="date" type="date" min={today()} className="field" {...register("date")} /></Field>
              <Field id="slot" label="Time slot" error={errors.slot?.message}>
                <select id="slot" className="field" {...register("slot")}>
                  {DELIVERY_SLOTS.filter((s) => (mode === "midnight" ? s.includes("Midnight") : !s.includes("Midnight"))).map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-line p-3">
              <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" {...register("gift")} />
              <Gift className="h-4 w-4 text-accent" />
              <span className="text-sm">Send as a gift to someone else</span>
            </label>
            {gift && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field id="rname" label="Recipient name" error={errors.recipientName?.message}><input id="rname" className="field" {...register("recipientName")} /></Field>
                <Field id="rphone" label="Recipient mobile (optional)" error={errors.recipientPhone?.message}><input id="rphone" className="field" inputMode="tel" {...register("recipientPhone")} /></Field>
              </motion.div>
            )}
            <div className="mt-4">
              <Field id="instructions" label="Special delivery instructions" error={errors.instructions?.message}>
                <textarea id="instructions" rows={2} className="field" placeholder="Call before arriving, gate code, surprise — don't ring the bell…" {...register("instructions")} />
              </Field>
            </div>
          </section>

          <section className="glass rounded-3xl p-5 sm:p-6">
            <h2 className="mb-1 font-semibold">3. Payment</h2>
            <p className="mb-4 flex items-center gap-1.5 text-xs text-muted"><Lock className="h-3.5 w-3.5" /> Prototype: payments are simulated — no card, UPI or wallet details are collected.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Payment method">
              {pays.map(({ id, label, icon: Icon }) => (
                <label key={id} className={cn("cursor-pointer rounded-2xl border p-3 text-center transition", payment === id ? "border-accent bg-accent/10" : "border-line hover:border-accent/50")}>
                  <input type="radio" value={id} className="sr-only" {...register("payment")} />
                  <Icon className="mx-auto h-5 w-5 text-accent" />
                  <span className="mt-1.5 block text-xs font-semibold">{label}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-dashed border-line p-4 text-sm text-muted">
              {payment === "upi" && "You'll see a mock UPI collect request after placing the order."}
              {(payment === "credit" || payment === "debit") && "A mock secure card gateway will be simulated — nothing is entered here."}
              {payment === "wallet" && "Paytm, PhonePe & Amazon Pay wallets (simulated)."}
              {payment === "cod" && "Pay in cash or UPI when your cake arrives."}
            </div>
          </section>
        </div>

        <aside className="glass h-fit rounded-3xl p-5 lg:sticky lg:top-24">
          <h2 className="font-semibold">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3">
                <CakeThumb config={it.config} className="h-14 w-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{it.config.name}</p>
                  <p className="text-xs text-muted">{it.config.weightKg} kg × {it.quantity}</p>
                </div>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatINR(totals.subtotal)}</dd></div>
            {totals.discount > 0 && <div className="flex justify-between text-emerald-500"><dt>Discount ({coupon})</dt><dd>−{formatINR(totals.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{totals.delivery ? formatINR(totals.delivery) : "Free"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">GST</dt><dd>{formatINR(totals.tax)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold"><dt>Total</dt><dd>{formatINR(totals.total)}</dd></div>
          </dl>
          <button type="submit" className="btn btn-primary mt-5 w-full py-3.5" disabled={placing}>
            {placing ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing payment…</> : <>Place order · {formatINR(totals.total)}</>}
          </button>
          {Object.keys(errors).length > 0 && <p className="mt-2 text-center text-xs text-red-400">Please fix the highlighted fields.</p>}
        </aside>
      </form>
    </div>
  );
}
