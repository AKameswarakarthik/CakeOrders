"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cake, Heart, Menu, Moon, ShoppingBag, Sparkles, Sun, User, X } from "lucide-react";
import { useCart, usePrefs, useUI } from "@/store/appStore";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/collections", label: "Collections" },
  { href: "/studio", label: "Design Studio" },
  { href: "/ai-designer", label: "AI Designer" },
  { href: "/track", label: "Track Order" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const hydrated = useUI((s) => s.hydrated);
  const { theme, setTheme } = usePrefs();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className={cn("sticky top-0 z-50 transition-all", scrolled || pathname !== "/" ? "glass-strong border-x-0 border-t-0" : "border-b border-transparent")}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6" aria-label="Main">
        <Link href="/" className="group flex items-center gap-2" aria-label="CakeVerse home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#f4c7c3] via-[#e8a598] to-[#c9a14a] text-[#2a1a14] shadow-lg transition-transform group-hover:rotate-12">
            <Cake className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Cake<span className="text-gradient">Verse</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link href={l.href} className={cn("relative rounded-full px-4 py-2 text-sm transition-colors", active ? "text-fg" : "text-muted hover:text-fg")}>
                  {active && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-accent/15 ring-1 ring-accent/30" />}
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="grid h-10 w-10 place-items-center rounded-full text-muted transition hover:bg-accent/10 hover:text-fg"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Link href="/saved" className="hidden h-10 w-10 place-items-center rounded-full text-muted transition hover:bg-accent/10 hover:text-fg sm:grid" aria-label="Saved designs" title="Saved designs">
            <Heart className="h-5 w-5" />
          </Link>
          <Link href="/profile" className="hidden h-10 w-10 place-items-center rounded-full text-muted transition hover:bg-accent/10 hover:text-fg sm:grid" aria-label="Profile" title="Profile">
            <User className="h-5 w-5" />
          </Link>
          <Link href="/cart" className="relative grid h-10 w-10 place-items-center rounded-full text-muted transition hover:bg-accent/10 hover:text-fg" aria-label={`Cart with ${count} items`}>
            <ShoppingBag className="h-5 w-5" />
            {hydrated && count > 0 && (
              <motion.span key={count} initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-[#1a0f0b]">
                {count}
              </motion.span>
            )}
          </Link>
          <Link href="/studio" className="btn btn-primary ml-1 hidden px-4 py-2 text-sm md:inline-flex">
            <Sparkles className="h-4 w-4" /> Design My Cake
          </Link>
          <button className="grid h-10 w-10 place-items-center rounded-full lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-line lg:hidden">
            <ul className="flex flex-col gap-1 p-4">
              {[...LINKS, { href: "/saved", label: "Saved Designs" }, { href: "/profile", label: "Profile" }, { href: "/faq", label: "FAQ" }, { href: "/contact", label: "Contact" }].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={cn("block rounded-xl px-4 py-3", pathname.startsWith(l.href) ? "bg-accent/15" : "hover:bg-accent/10")}>
                    {l.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <Link href="/studio" className="btn btn-primary w-full py-3">
                  <Sparkles className="h-4 w-4" /> Design My Cake
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
