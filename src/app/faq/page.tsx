"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import { FAQS } from "@/data/content";
import { cn } from "@/lib/utils";

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);
  const [q, setQ] = useState("");
  const list = FAQS.filter((f) => (f.q + f.a).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-5xl">Frequently asked questions</h1>
      <div className="relative mt-8">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input className="field pl-10" placeholder="Search questions…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search FAQs" />
      </div>
      <ul className="mt-6 space-y-3">
        {list.map((f, i) => (
          <li key={f.q} className="glass overflow-hidden rounded-2xl">
            <button className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
              {f.q}
              <ChevronDown className={cn("h-5 w-5 shrink-0 transition", open === i && "rotate-180")} />
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        ))}
        {list.length === 0 && <p className="text-center text-sm text-muted">No questions match “{q}”.</p>}
      </ul>
    </div>
  );
}
