import Link from "next/link";
import type { Metadata } from "next";
import { Award, ChefHat, Leaf, Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "About Us" };

const STATS = [
  ["12,000+", "celebrations baked"],
  ["14", "patisseries in 8 cities"],
  ["60+", "3D decorations"],
  ["4.9★", "average rating"],
];

const VALUES = [
  { icon: ChefHat, title: "Artisan craft", text: "Every cake is hand-built by trained pastry artists from your 3D blueprint." },
  { icon: Leaf, title: "Honest ingredients", text: "Belgian couverture, fresh cream, seasonal fruit and no artificial preservatives." },
  { icon: Sparkles, title: "Design-first", text: "We believe customers should see their cake before it's baked — in full 3D." },
  { icon: Award, title: "Freshness promise", text: "Baked the same day and delivered in temperature-controlled boxes." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="label text-accent">About CakeVerse</p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight">Where pastry artistry meets <span className="text-gradient italic">3D imagination</span>.</h1>
      <p className="mt-6 max-w-2xl text-lg text-muted">
        CakeVerse began in a small Hyderabad kitchen with one frustration: customers could never see their custom cake until it arrived. So we built a studio where you design every tier,
        rose and letter in real-time 3D — and our chefs bake exactly that.
      </p>
      <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS.map(([n, l]) => (
          <div key={l} className="glass rounded-3xl p-6 text-center">
            <p className="font-display text-4xl text-gradient">{n}</p>
            <p className="mt-1 text-sm text-muted">{l}</p>
          </div>
        ))}
      </div>
      <div className="mt-16 grid gap-6 sm:grid-cols-2">
        {VALUES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="glass flex gap-4 rounded-3xl p-6">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent"><Icon className="h-6 w-6" /></span>
            <div>
              <h2 className="font-display text-xl">{title}</h2>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-16 text-center">
        <Link href="/studio?new=1" className="btn btn-primary px-7 py-3.5">Design your cake</Link>
      </div>
    </div>
  );
}
