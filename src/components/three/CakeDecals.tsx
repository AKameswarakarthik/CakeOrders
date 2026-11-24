"use client";
/** Personalised message & edible photo rendered onto the cake via dynamic canvas textures. */
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import type { CakeConfig, CakeMessage, PhotoConfig } from "@/types/cake";
import type { TierLayout } from "@/lib/cake/dimensions";
import { autoFontFor, FONT_WEIGHT, resolveFontFamily } from "@/lib/messageFonts";
import { outlinePointAtAngle } from "./geometry";
import { tierPolygon } from "./placement";

/* ── message texture ─────────────────────────────────── */
function drawMessage(m: CakeMessage, aspect: number, curved: boolean): HTMLCanvasElement {
  const W = 1024;
  const H = Math.round(W / aspect);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const font = autoFontFor(m.text, m.font);
  const family = resolveFontFamily(font);
  const weight = FONT_WEIGHT[font];
  const lines = m.text.split("\n").slice(0, 3);
  let size = (curved ? 130 : 150) * m.size;
  const fit = () => {
    ctx.font = `${weight} ${size}px ${family}`;
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    return curved ? widest < W * 1.25 : widest < W * 0.9 && size * lines.length * 1.15 < H * 0.9;
  };
  while (!fit() && size > 18) size -= 4;

  const paint = (draw: () => void) => {
    // material-specific look
    if (m.material === "chocolate") {
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = m.color;
      draw();
      ctx.shadowColor = "transparent";
      ctx.globalCompositeOperation = "source-atop";
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "rgba(255,255,255,0.28)");
      g.addColorStop(0.5, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
    } else if (m.material === "fondant") {
      ctx.lineJoin = "round";
      ctx.lineWidth = size * 0.09;
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 4;
      drawStroke();
      ctx.shadowColor = "transparent";
      ctx.fillStyle = m.color;
      draw();
    } else {
      ctx.lineWidth = size * 0.04;
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      drawStroke();
      ctx.fillStyle = m.color;
      draw();
    }
  };

  let drawStroke = () => {};
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (curved) {
    const text = lines.join(" ");
    const radius = W * 0.42;
    const cx = W / 2;
    const cy = H / 2 + radius * 0.75;
    const chars = [...text];
    const widths = chars.map((ch) => ctx.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0);
    const arc = Math.min(Math.PI * 0.95, total / radius);
    const drawArc = (mode: "fill" | "stroke") => {
      let a = -Math.PI / 2 - arc / 2;
      chars.forEach((ch, i) => {
        const w = (widths[i] / total) * arc;
        a += w / 2;
        ctx.save();
        ctx.translate(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
        ctx.rotate(a + Math.PI / 2);
        if (mode === "fill") ctx.fillText(ch, 0, 0);
        else ctx.strokeText(ch, 0, 0);
        ctx.restore();
        a += w / 2;
      });
    };
    drawStroke = () => drawArc("stroke");
    paint(() => drawArc("fill"));
  } else {
    const lh = size * 1.15;
    const y0 = H / 2 - ((lines.length - 1) * lh) / 2;
    drawStroke = () => lines.forEach((l, i) => ctx.strokeText(l, W / 2, y0 + i * lh));
    paint(() => lines.forEach((l, i) => ctx.fillText(l, W / 2, y0 + i * lh)));
  }
  return c;
}

function useFontsReady(font: string) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) return;
    let alive = true;
    const fam = resolveFontFamily(font as CakeMessage["font"]);
    document.fonts.load(`600 64px ${fam}`).then(() => alive && setV((x) => x + 1)).catch(() => {});
    document.fonts.ready.then(() => alive && setV((x) => x + 1));
    return () => {
      alive = false;
    };
  }, [font]);
  return v;
}

function useMessageTexture(m: CakeMessage, aspect: number, curved: boolean) {
  const fontsVersion = useFontsReady(autoFontFor(m.text, m.font));
  const tex = useMemo(() => {
    if (typeof document === "undefined" || !m.text.trim()) return null;
    const t = new THREE.CanvasTexture(drawMessage(m, aspect, curved));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.text, m.font, m.color, m.size, m.material, aspect, curved, fontsVersion]);
  useEffect(() => () => tex?.dispose(), [tex]);
  return tex;
}

export function MessageMesh({ config, layouts }: { config: CakeConfig; layouts: TierLayout[] }) {
  const m = config.message;
  const textShape = config.shape === "number" || config.shape === "letter";
  const position = textShape && m.position !== "plaque" ? "board" : config.shape === "dome" && m.position === "side-front" ? "top-front" : m.position;
  const top = layouts[layouts.length - 1];
  const bottom = layouts[0];
  const curved = m.curved && (position === "top-center" || position === "top-front");
  const aspect = curved ? 1.6 : position === "side-front" ? 4.5 : position === "plaque" ? 2.4 : 3;
  const tex = useMessageTexture(m, aspect, curved);
  if (!tex || !top) return null;

  const mat = <meshStandardMaterial map={tex} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-4} roughness={m.material === "chocolate" ? 0.3 : 0.6} />;

  if (position === "plaque" || position === "board") {
    const target = position === "board" ? { y: 0, z: bottom.depth / 2 + 0.22 } : { y: top.y + top.height, z: top.depth * 0.18 };
    return (
      <group position={[0, target.y, target.z]} rotation={[-0.35, 0, 0]}>
        <mesh castShadow position={[0, 0.1, 0]}>
          <boxGeometry args={[0.62, 0.26, 0.025]} />
          <meshPhysicalMaterial color="#f7efe2" roughness={0.35} clearcoat={0.6} />
        </mesh>
        <mesh position={[0, 0.1, 0.0131]}>
          <planeGeometry args={[0.6, 0.25]} />
          {mat}
        </mesh>
      </group>
    );
  }

  if (position === "side-front") {
    const round = ["round", "oval", "multi-tier"].includes(config.shape);
    const h = bottom.height * 0.55;
    const y = bottom.y + bottom.height * 0.5;
    if (round) {
      const R = bottom.width / 2 + 0.012;
      const arcLen = Math.min(Math.PI * 0.8, (h * aspect) / R);
      const zScale = bottom.depth / bottom.width;
      return (
        <mesh position={[0, y, 0]} scale={[1, 1, zScale]} renderOrder={2}>
          <cylinderGeometry args={[R, R, h, 64, 1, true, -arcLen / 2, arcLen]} />
          {mat}
        </mesh>
      );
    }
    const { point, normal } = outlinePointAtAngle(tierPolygon(config.shape, bottom), Math.PI / 2);
    const w = Math.min(h * aspect, bottom.width * 0.85);
    return (
      <mesh position={[point.x + normal.x * 0.008, y, point.y + normal.y * 0.008]} rotation={[0, Math.atan2(normal.x, normal.y), 0]} renderOrder={2}>
        <planeGeometry args={[w, w / aspect]} />
        {mat}
      </mesh>
    );
  }

  // on top
  const usable = Math.min(top.width, top.depth) * (config.shape === "heart" ? 0.62 : 0.8);
  const w = position === "top-front" ? usable * 0.95 : usable;
  const z = position === "top-front" ? top.depth * (config.shape === "heart" ? 0.08 : 0.22) : 0;
  const y = top.y + (config.shape === "dome" ? top.height * 0.82 : top.height) + 0.004;
  return (
    <mesh position={[0, y, z]} rotation={[-Math.PI / 2 + (config.shape === "dome" ? -0.45 : 0), 0, 0]} renderOrder={2}>
      <planeGeometry args={[w, w / aspect]} />
      {mat}
    </mesh>
  );
}

/* ── edible photo ────────────────────────────────────── */
function drawPhoto(img: HTMLImageElement, p: PhotoConfig): HTMLCanvasElement {
  const S = 768;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  ctx.save();
  ctx.beginPath();
  if (p.shape === "circle") ctx.arc(S / 2, S / 2, S / 2 - 18, 0, Math.PI * 2);
  else {
    const r = 40;
    ctx.roundRect(18, 18, S - 36, S - 36, r);
  }
  ctx.clip();
  // crop: cover + zoom + offset
  const scale = Math.max(S / img.width, S / img.height) * p.zoom;
  const w = img.width * scale;
  const h = img.height * scale;
  const ox = (S - w) / 2 + (p.offsetX * (w - S)) / 2;
  const oy = (S - h) / 2 + (p.offsetY * (h - S)) / 2;
  ctx.drawImage(img, ox, oy, w, h);
  ctx.restore();
  // piped frosting frame
  ctx.lineWidth = 16;
  ctx.strokeStyle = "rgba(255,250,240,0.95)";
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  if (p.shape === "circle") ctx.arc(S / 2, S / 2, S / 2 - 18, 0, Math.PI * 2);
  else ctx.roundRect(18, 18, S - 36, S - 36, 40);
  ctx.stroke();
  return c;
}

export function PhotoMesh({ config, layouts }: { config: CakeConfig; layouts: TierLayout[] }) {
  const p = config.photo;
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!p.dataUrl) {
      setImg(null);
      return;
    }
    const i = new Image();
    i.onload = () => setImg(i);
    i.src = p.dataUrl;
  }, [p.dataUrl]);
  const tex = useMemo(() => {
    if (!img) return null;
    const t = new THREE.CanvasTexture(drawPhoto(img, p));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, p.zoom, p.offsetX, p.offsetY, p.shape]);
  useEffect(() => () => tex?.dispose(), [tex]);

  const top = layouts[layouts.length - 1];
  if (!tex || !top || config.shape === "number" || config.shape === "letter") return null;
  const size = Math.min(top.width, top.depth) * p.scale;
  const dome = config.shape === "dome";
  return (
    <mesh
      position={[p.posX * top.width * 0.5, top.y + (dome ? top.height * 0.9 : top.height) + 0.003, p.posY * top.depth * 0.5]}
      rotation={[-Math.PI / 2 + (dome ? -0.3 : 0), 0, 0]}
      renderOrder={1}
    >
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={tex} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-3} roughness={0.45} />
    </mesh>
  );
}
