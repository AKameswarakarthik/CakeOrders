"use client";
import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock, MapPin, Moon, Quote, ShieldCheck, Star, Store, Truck } from "lucide-react";
import { OCCASIONS } from "@/data/occasions";
import { TEMPLATES } from "@/data/templates";
import { FLAVOR_COMBOS, HOW_IT_WORKS, REVIEWS } from "@/data/content";
import { CakeIllustration } from "@/components/builder/Fallback2D";
import { cakeSubtotal } from "@/lib/pricing/PricingEngine";
import { formatINR } from "@/lib/utils";

export function SectionTitle({ eyebrow, title, sub, center }: { eyebrow: string; title: React.ReactNode; sub?: string; center?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6 }} className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="label text-accent">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-muted">{sub}</p>}
    </motion.div>
  );
}

export function OccasionGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <SectionTitle eyebrow="Shop by occasion" title={<>Every celebration, <span className="text-gradient italic">beautifully</span> designed</>} sub="Pick an occasion and the studio recommends shapes, colours and decorations made for it." />
      <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-5">
        {OCCASIONS.map((o, i) => (
          <motion.div key={o.id} initial={{ opacity: 0, y: 30, rotate: -2 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, type: "spring", damping: 18 }}>
            <Link href={`/studio?occasion=${o.id}`} className="group relative block h-full overflow-hidden rounded-3xl border border-line p-5 transition hover:-translate-y-1 hover:border-accent/50">
              <div className="absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-45" style={{ background: o.gradient }} />
              <div className="relative">
                <motion.span className="inline-block text-4xl" whileHover={{ rotate: [0, -12, 12, 0], scale: 1.2 }} transition={{ duration: 0.6 }}>
                  {o.emoji}
                </motion.span>
                <h3 className="mt-4 font-semibold">{o.name}</h3>
                <p className="mt-1 text-xs text-muted">{o.tagline}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent opacity-0 transition group-hover:opacity-100">
                  Design now <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function TemplateCard({ id, index = 0 }: { id: string; index?: number }) {
  const t = TEMPLATES.find((x) => x.id === id)!;
  const cfg = useMemo(() => t.build(), [t]);
  const price = Math.round(cakeSubtotal(cfg) * 1.05);
  return (
    <motion.article initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }} className="group glass relative overflow-hidden rounded-3xl transition hover:-translate-y-1 hover:glow">
      <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(circle_at_50%_40%,color-mix(in_oklab,var(--accent)_22%,transparent),transparent_70%)]">
        <CakeIllustration config={cfg} idKey={t.id} className="h-full w-full transition duration-700 group-hover:scale-110" />
        {t.badge && <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1a0f0b]">{t.badge}</span>}
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-xl">{t.name}</h3>
          <span className="flex items-center gap-1 text-xs text-gold"><Star className="h-3 w-3 fill-current" /> {t.rating}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{t.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-semibold">from {formatINR(price)}</span>
          <Link href={`/studio?template=${t.id}`} className="btn btn-ghost px-4 py-2 text-xs">
            Customise <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

export function Trending() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionTitle eyebrow="Trending designs" title="Loved this week" sub="Start from a bestseller and make it yours in the studio." />
        <Link href="/collections" className="btn btn-ghost px-5 py-2.5 text-sm">
          View all collections <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {["rose-gold-romance", "midnight-truffle", "royal-wedding", "mirror-galaxy"].map((id, i) => (
          <TemplateCard key={id} id={id} index={i} />
        ))}
      </div>
    </section>
  );
}

export function BuildYourOwn() {
  const layers = [
    { w: 88, c: "linear-gradient(90deg,#e8a598,#f4c7c3,#e8a598)", label: "Tier 1 · Red velvet" },
    { w: 68, c: "linear-gradient(90deg,#c9a14a,#f3d77a,#c9a14a)", label: "Tier 2 · Gold finish" },
    { w: 48, c: "linear-gradient(90deg,#3b2218,#6b3f2a,#3b2218)", label: "Tier 3 · Ganache" },
  ];
  return (
    <section className="relative overflow-hidden py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <SectionTitle eyebrow="Build your own cake" title={<>Like a luxury car configurator — <span className="text-gradient italic">for cake</span></>} sub="Ten shapes, five tiers, fifteen flavours, ten frostings, sixty+ 3D decorations, messages in three languages and edible photo prints." />
          <ul className="mt-8 grid grid-cols-2 gap-3 text-sm">
            {["Real-time 3D preview", "Drag & drop decorations", "Per-tier customisation", "Live price breakdown", "Undo / redo & auto-save", "Share your design link"].map((f, i) => (
              <motion.li key={f} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} className="glass flex items-center gap-2 rounded-2xl px-3 py-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {f}
              </motion.li>
            ))}
          </ul>
          <Link href="/studio?new=1" className="btn btn-primary mt-8 px-7 py-3.5">
            Open the studio <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="relative mx-auto flex h-[420px] w-full max-w-md flex-col-reverse items-center justify-start">
          <motion.div initial={{ opacity: 0, scaleX: 0.6 }} whileInView={{ opacity: 1, scaleX: 1 }} viewport={{ once: true }} className="h-4 w-[96%] rounded-full bg-gradient-to-r from-[#a07b1f] via-[#f3d77a] to-[#a07b1f] shadow-2xl" />
          {layers.map((l, i) => (
            <motion.div
              key={i}
              initial={{ y: -260, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.3 + i * 0.35, type: "spring", damping: 14, stiffness: 120 }}
              className="group relative h-24 rounded-2xl shadow-[inset_0_-12px_20px_rgba(0,0,0,0.18),0_20px_40px_-20px_rgba(0,0,0,0.6)]"
              style={{ width: `${l.w}%`, background: l.c }}
            >
              <span className="absolute -right-2 top-1/2 translate-x-full -translate-y-1/2 whitespace-nowrap rounded-full glass px-2.5 py-1 text-[11px] opacity-0 transition group-hover:opacity-100 sm:opacity-100">{l.label}</span>
              {i === 2 && (
                <motion.div initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ delay: 1.6, duration: 0.8 }} className="absolute inset-x-0 top-0 h-8 origin-top rounded-t-2xl" style={{ background: "radial-gradient(circle at 10% 100%, transparent 8px, #d4af37 9px) 0 0/22px 100%" }} />
              )}
            </motion.div>
          ))}
          <motion.span initial={{ y: -200, opacity: 0, rotate: -30 }} whileInView={{ y: 0, opacity: 1, rotate: 0 }} viewport={{ once: true }} transition={{ delay: 1.5, type: "spring" }} className="text-6xl drop-shadow-xl">
            🌹
          </motion.span>
        </div>
      </div>
    </section>
  );
}

export function FlavorCombos() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <SectionTitle center eyebrow="Popular flavour combinations" title="Pairings our chefs swear by" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FLAVOR_COMBOS.map((f, i) => (
          <motion.div key={f.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="glass group flex items-center gap-5 rounded-3xl p-5 transition hover:border-accent/50">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl shadow-lg transition group-hover:scale-105" style={{ background: `repeating-linear-gradient(180deg, ${f.colors[0]} 0 14px, ${f.colors[1]} 14px 20px)` }}>
              <span className="absolute inset-x-0 top-0 h-4" style={{ background: f.colors[2] }} />
            </div>
            <div>
              <h3 className="font-display text-xl">{f.name}</h3>
              <p className="text-xs text-accent">{f.note}</p>
              <p className="mt-1.5 text-sm text-muted">{f.flavors.join(" · ")}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function Reviews() {
  return (
    <section className="overflow-hidden py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle eyebrow="Customer reviews" title={<>12,000+ <span className="text-gradient italic">sweet</span> memories</>} />
      </div>
      <div className="relative mt-12">
        <motion.div className="flex w-max gap-5 px-4" animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, duration: 45, ease: "linear" }}>
          {[...REVIEWS, ...REVIEWS].map((r, i) => (
            <figure key={i} className="glass w-[320px] shrink-0 rounded-3xl p-6">
              <Quote className="h-6 w-6 text-accent" />
              <blockquote className="mt-3 text-sm leading-relaxed">{r.text}</blockquote>
              <figcaption className="mt-4 flex items-center justify-between text-xs">
                <span>
                  <b className="block text-sm">{r.name}</b>
                  <span className="text-muted">{r.city} · {r.occasion}</span>
                </span>
                <span className="flex text-gold">
                  {Array.from({ length: r.rating }, (_, k) => (
                    <Star key={k} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </span>
              </figcaption>
            </figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6">
      <SectionTitle center eyebrow="How it works" title="From imagination to doorstep" />
      <ol className="relative mt-14 grid gap-6 md:grid-cols-4">
        <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent md:block" />
        {HOW_IT_WORKS.map((s, i) => (
          <motion.li key={s.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} className="relative text-center">
            <span className="glass glow relative z-10 mx-auto grid h-20 w-20 place-items-center rounded-full text-3xl">{s.icon}</span>
            <p className="mt-5 text-xs font-bold text-accent">STEP {i + 1}</p>
            <h3 className="mt-1 font-display text-xl">{s.title}</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm text-muted">{s.text}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

export function DeliveryInfo() {
  const items = [
    { icon: Truck, title: "Same-day delivery", text: "Order single-tier cakes before 4 PM for delivery today." },
    { icon: Moon, title: "Midnight surprises", text: "23:30 – 00:30 slot available city-wide. Code MIDNIGHT = free." },
    { icon: Store, title: "Store pickup", text: "Collect from any of our 14 patisseries at zero delivery cost." },
    { icon: ShieldCheck, title: "Freshness promise", text: "Temperature-controlled riders and tamper-proof packaging." },
    { icon: Clock, title: "Lead times", text: "Multi-tier & photo cakes: 24h. Weddings above 5 kg: 48h." },
    { icon: MapPin, title: "We deliver to", text: "Hyderabad, Bengaluru, Mumbai, Delhi NCR, Chennai, Kolkata & more." },
  ];
  return (
    <section id="delivery" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="glass relative overflow-hidden rounded-[2.5rem] p-8 sm:p-12">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <SectionTitle eyebrow="Delivery information" title="Delivered with care" sub="Free standard delivery on orders above ₹1,499." />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6">
      <motion.h2 initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="font-display text-4xl sm:text-6xl">
        Ready to bake <span className="text-gradient italic">magic</span>?
      </motion.h2>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/studio?new=1" className="btn btn-primary px-7 py-3.5">Design My Cake</Link>
        <Link href="/ai-designer" className="btn btn-ghost px-7 py-3.5">✨ Try the AI Designer</Link>
      </div>
    </section>
  );
}
