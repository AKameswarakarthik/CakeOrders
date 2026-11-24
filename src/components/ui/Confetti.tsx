"use client";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/utils";

/** Lightweight canvas confetti burst (no dependencies). */
export function Confetti({ duration = 4500 }: { duration?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      c.width = window.innerWidth * dpr;
      c.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);
    const colors = ["#f4c7c3", "#e8a598", "#d4af37", "#b76e79", "#fffaf3", "#9fe0a8", "#9fc8f0", "#c7a8f0"];
    const parts = Array.from({ length: 220 }, () => ({
      x: c.width / 2 + (Math.random() - 0.5) * c.width * 0.3,
      y: c.height * 0.35,
      vx: (Math.random() - 0.5) * 18 * dpr,
      vy: (-Math.random() * 18 - 6) * dpr,
      w: (6 + Math.random() * 8) * dpr,
      h: (3 + Math.random() * 5) * dpr,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const elapsed = t - start;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, elapsed - duration + 1200) / 1200);
      for (const p of parts) {
        p.vy += 0.45 * dpr;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)));
        ctx.restore();
      }
      if (elapsed < duration) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, c.width, c.height);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [duration]);
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[80] h-full w-full" aria-hidden />;
}
