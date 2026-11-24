"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Heart, Moon, Package, Sun, User } from "lucide-react";
import { toast, useOrders, usePrefs, useSaved, useUI } from "@/store/appStore";
import { STATUS_FLOW, simulatedStatus } from "@/lib/services/orderService";
import { formatINR } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  phone: z.string().trim().regex(/^$|^(\+91[\s-]?)?[6-9]\d{9}$/, "Enter a valid mobile number"),
  email: z.string().trim().email("Enter a valid email").or(z.literal("")),
  address: z.string().trim(),
  pin: z.string().trim().regex(/^$|^\d{6}$/, "6-digit PIN"),
});
type V = z.infer<typeof schema>;

export default function ProfilePage() {
  const hydrated = useUI((s) => s.hydrated);
  const { profile, setProfile, theme, setTheme } = usePrefs();
  const orders = useOrders((s) => s.orders);
  const saved = useSaved((s) => s.designs.length);
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<V>({ resolver: zodResolver(schema), defaultValues: profile });
  useEffect(() => {
    if (hydrated) reset(profile);
  }, [hydrated, profile, reset]);

  if (!hydrated) return <div className="mx-auto mt-10 h-96 max-w-5xl skeleton rounded-3xl" />;
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[#f4c7c3] via-[#e8a598] to-[#c9a14a] text-2xl font-bold text-[#1a0f0b]">
          {profile.name ? profile.name[0].toUpperCase() : <User />}
        </span>
        <div>
          <h1 className="font-display text-3xl">{profile.name || "Your profile"}</h1>
          <p className="text-sm text-muted">Details are stored locally and pre-fill checkout.</p>
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-3xl p-5"><Package className="h-5 w-5 text-accent" /><p className="mt-3 font-display text-3xl">{orders.length}</p><p className="text-xs text-muted">Orders</p></div>
        <Link href="/saved" className="glass rounded-3xl p-5 hover:border-accent/50"><Heart className="h-5 w-5 text-accent" /><p className="mt-3 font-display text-3xl">{saved}</p><p className="text-xs text-muted">Saved designs</p></Link>
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="glass rounded-3xl p-5 text-left hover:border-accent/50">
          {theme === "dark" ? <Moon className="h-5 w-5 text-accent" /> : <Sun className="h-5 w-5 text-accent" />}
          <p className="mt-3 font-display text-3xl capitalize">{theme}</p>
          <p className="text-xs text-muted">Theme · tap to switch</p>
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <form className="glass rounded-3xl p-6" onSubmit={handleSubmit((v) => (setProfile(v), reset(v), toast({ title: "Profile saved", tone: "success" })))} noValidate>
          <h2 className="font-semibold">Personal details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {([
              ["name", "Full name", "name"],
              ["phone", "Mobile", "tel"],
              ["email", "Email", "email"],
              ["pin", "PIN code", "postal-code"],
            ] as const).map(([k, label, ac]) => (
              <div key={k}>
                <label className="label" htmlFor={`p-${k}`}>{label}</label>
                <input id={`p-${k}`} className="field mt-1.5" autoComplete={ac} {...register(k)} />
                {errors[k] && <p className="mt-1 text-xs text-red-400">{errors[k]?.message}</p>}
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="label" htmlFor="p-address">Default address</label>
              <textarea id="p-address" rows={2} className="field mt-1.5" {...register("address")} />
            </div>
          </div>
          <button className="btn btn-primary mt-5 px-6 py-2.5 text-sm" disabled={!isDirty}>Save profile</button>
        </form>

        <section className="glass rounded-3xl p-6">
          <h2 className="font-semibold">Order history</h2>
          {orders.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No orders yet. <Link href="/studio?new=1" className="text-accent">Design your first cake →</Link></p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <Link href={`/track?id=${o.id}`} className="font-mono hover:text-accent">{o.id}</Link>
                    <p className="text-xs text-muted">{new Date(o.createdAt).toLocaleString("en-IN")} · {o.items.length} cake(s)</p>
                  </div>
                  <div className="text-right">
                    <p>{formatINR(o.totals.total)}</p>
                    <p className="text-xs text-accent">{STATUS_FLOW[simulatedStatus(o)].label}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
