"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { getTemplate } from "@/data/templates";
import { supportsWebGL, CakeIllustration } from "@/components/builder/Fallback2D";

const CakeShowcase = dynamic(() => import("@/components/three/CakeShowcase"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center">
      <span className="h-14 w-14 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
    </div>
  ),
});

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const scrollP = useRef(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => (scrollP.current = v));
  const textY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const [webgl, setWebgl] = useState(true);
  useEffect(() => setWebgl(supportsWebGL()), []);
  const config = useMemo(() => getTemplate("midnight-truffle")!.build(), []);

  return (
    <section ref={ref} className="relative min-h-[calc(100dvh-4rem)] overflow-hidden">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl items-center gap-6 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr]">
        <motion.div style={{ y: textY, opacity: textOpacity }} className="relative z-10 pt-10 lg:pt-0">
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="chip glass">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> India&apos;s first 3D cake design studio
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }} className="mt-6 font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Your Imagination.
            <br />
            <span className="text-gradient italic">Your Cake.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.7 }} className="mt-6 max-w-lg text-lg text-muted">
            Design your perfect celebration cake in an immersive 3D experience — shapes, tiers, chocolate roses, figurines and your own message, hand-crafted and delivered fresh.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8 flex flex-wrap gap-3">
            <Link href="/studio?new=1" className="btn btn-primary px-7 py-3.5">
              Design My Cake <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/collections" className="btn btn-ghost px-7 py-3.5">
              Explore Collections
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-10 flex items-center gap-6 text-sm text-muted">
            <div className="flex -space-x-2">
              {["#f4c7c3", "#e8a598", "#c9a14a", "#b76e79"].map((c) => (
                <span key={c} className="h-8 w-8 rounded-full border-2 border-bg" style={{ background: c }} />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1 text-gold">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <p>4.9 from 12,000+ celebrations</p>
            </div>
          </motion.div>
        </motion.div>

        <div className="relative h-[52vh] min-h-[380px] lg:h-[78vh]">
          <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--accent)_35%,transparent),transparent_65%)] blur-2xl" />
          {webgl ? <CakeShowcase config={config} hero scroll={scrollP} interactiveOrbit className="!absolute inset-0" /> : <CakeIllustration config={config} idKey="hero" className="h-full w-full" />}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 }} className="glass glow absolute bottom-6 left-0 hidden rounded-2xl p-3 sm:block">
            <p className="text-[11px] uppercase tracking-wider text-muted">Live 3D preview</p>
            <p className="font-display text-lg">Midnight Truffle Drip</p>
            <p className="text-xs text-muted">Drag to rotate ↻</p>
          </motion.div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="h-9 w-5 rounded-full border border-line p-1">
          <span className="block h-2 w-full rounded-full bg-accent" />
        </motion.div>
      </div>
    </section>
  );
}
