"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AtSign, Cake, Camera, Mail, MapPin, MessageCircle, Phone, PlayCircle } from "lucide-react";

const COLS = [
  { title: "Create", links: [["Design Studio", "/studio"], ["AI Cake Designer", "/ai-designer"], ["Collections", "/collections"], ["Saved Designs", "/saved"]] },
  { title: "Orders", links: [["Cart", "/cart"], ["Track Order", "/track"], ["Profile", "/profile"], ["FAQ", "/faq"]] },
  { title: "Company", links: [["About Us", "/about"], ["Contact", "/contact"], ["Delivery Info", "/#delivery"], ["How it Works", "/#how"]] },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/studio")) return null; // full-height app layout
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-5">
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#f4c7c3] via-[#e8a598] to-[#c9a14a] text-[#2a1a14]">
              <Cake className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-semibold">CakeVerse</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm text-muted">Couture cakes designed by you in 3D, hand-crafted by our pastry artists, and delivered fresh across India.</p>
          <ul className="mt-5 space-y-2 text-sm text-muted">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /> Road No. 36, Jubilee Hills, Hyderabad</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent" /> +91 90000 12345</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent" /> hello@cakeverse.example</li>
          </ul>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h3 className="label">{c.title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {c.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-muted transition hover:text-accent">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-muted sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} CakeVerse Patisserie. Prototype — no real payments are processed.</p>
          <div className="flex gap-2">
            {([[Camera, "Instagram"], [MessageCircle, "Facebook"], [AtSign, "X / Twitter"], [PlayCircle, "YouTube"]] as const).map(([Icon, name]) => (
              <a key={name} href="#" aria-label={name} title={name} className="grid h-9 w-9 place-items-center rounded-full border border-line transition hover:border-accent hover:text-accent">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
