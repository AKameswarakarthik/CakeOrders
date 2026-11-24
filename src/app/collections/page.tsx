"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { TEMPLATES } from "@/data/templates";
import { OCCASIONS } from "@/data/occasions";
import { TemplateCard } from "@/components/home/Sections";
import type { OccasionId } from "@/types/cake";

export default function CollectionsPage() {
  const [filter, setFilter] = useState<OccasionId | "all">("all");
  const list = TEMPLATES.filter((t) => filter === "all" || t.occasion === filter);
  const occasions = OCCASIONS.filter((o) => TEMPLATES.some((t) => t.occasion === o.id));
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="label text-accent">Cake collections</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">Signature designs, <span className="text-gradient italic">ready to personalise</span></h1>
      <p className="mt-3 max-w-2xl text-muted">Every collection cake opens in the 3D studio so you can change any detail — shape, tiers, flavours, colours, decorations and message.</p>
      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter by occasion">
        <button role="tab" aria-selected={filter === "all"} className="chip" data-active={filter === "all"} onClick={() => setFilter("all")}>All</button>
        {occasions.map((o) => (
          <button key={o.id} role="tab" aria-selected={filter === o.id} className="chip" data-active={filter === o.id} onClick={() => setFilter(o.id)}>
            {o.emoji} {o.name}
          </button>
        ))}
      </div>
      <motion.div layout className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((t, i) => (
          <TemplateCard key={t.id} id={t.id} index={i} />
        ))}
      </motion.div>
    </div>
  );
}
