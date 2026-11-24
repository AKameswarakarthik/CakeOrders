"use client";
/**
 * Procedural, replaceable 3D models for every decoration kind.
 * Each model sits with its base at y = 0, real-world scale (cake radius ≈ 1).
 * Provide `modelUrl` on a DecorationDef to swap in a GLB/GLTF asset instead.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import type { DecorationModel } from "@/types/cake";
import { getLoadedFont, loadCakeFont } from "./geometry";
import { prefersReducedMotion } from "@/lib/utils";

export interface ModelProps {
  color: string;
  label?: string;
  /** play intro animation (bloom etc.) */
  animate?: boolean;
}

const isMetal = (c: string) => ["#d4af37", "#c0c0c0", "#d9b04c"].includes(c.toLowerCase());

function Mat({ color, kind = "choc" }: { color: string; kind?: "choc" | "matte" | "glossy" | "metal" | "fondant" | "fruit" }) {
  const metal = kind === "metal" || isMetal(color);
  if (metal) return <meshPhysicalMaterial color={color} metalness={0.95} roughness={0.25} clearcoat={0.6} envMapIntensity={1.8} />;
  switch (kind) {
    case "matte":
      return <meshStandardMaterial color={color} roughness={0.85} />;
    case "fondant":
      return <meshPhysicalMaterial color={color} roughness={0.55} sheen={0.4} sheenColor="#ffffff" />;
    case "glossy":
    case "fruit":
      return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} envMapIntensity={1.3} />;
    default:
      return <meshPhysicalMaterial color={color} roughness={0.32} clearcoat={0.7} clearcoatRoughness={0.2} envMapIntensity={1} />;
  }
}

/* ── shared geometry factories ───────────────────────── */
function starShape(outer: number, inner: number, points = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

function heartShape(size: number) {
  const s = new THREE.Shape();
  const k = size;
  s.moveTo(0, -k * 0.9);
  s.bezierCurveTo(k * 0.15, -k * 0.6, k * 1.05, -k * 0.1, k * 0.95, k * 0.35);
  s.bezierCurveTo(k * 0.85, k * 0.85, k * 0.2, k * 0.95, 0, k * 0.5);
  s.bezierCurveTo(-k * 0.2, k * 0.95, -k * 0.85, k * 0.85, -k * 0.95, k * 0.35);
  s.bezierCurveTo(-k * 1.05, -k * 0.1, -k * 0.15, -k * 0.6, 0, -k * 0.9);
  return s;
}

/** dispose a memoised geometry when it changes / unmounts */
function useDisposable<T extends { dispose: () => void }>(obj: T): T {
  useEffect(() => () => obj.dispose(), [obj]);
  return obj;
}

const extrude = (shape: THREE.Shape, depth: number, bevel = 0.012) => {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 16 });
  g.center();
  return g;
};

function useTextGeometry(text: string, size: number, depth: number) {
  const [font, setFont] = useState(getLoadedFont());
  useEffect(() => {
    if (!font) loadCakeFont().then(setFont).catch(() => {});
  }, [font]);
  const geo = useMemo(() => {
    if (!font) return null;
    const g = new TextGeometry(text || "?", { font, size, depth, curveSegments: 6, bevelEnabled: true, bevelThickness: depth * 0.25, bevelSize: size * 0.03, bevelSegments: 2 });
    g.computeBoundingBox();
    const bb = g.boundingBox!;
    g.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
    return g;
  }, [font, text, size, depth]);
  useEffect(() => () => geo?.dispose(), [geo]);
  return geo;
}

function useLabelTexture(text: string, color: string, opts: { font?: string; bg?: string; w?: number; h?: number } = {}) {
  const tex = useMemo(() => {
    if (typeof document === "undefined") return null;
    const w = opts.w ?? 1024;
    const h = opts.h ?? 320;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    if (opts.bg) {
      ctx.fillStyle = opts.bg;
      ctx.fillRect(0, 0, w, h);
    }
    const fam = getComputedStyle(document.documentElement).getPropertyValue("--font-script").trim() || "cursive";
    let size = h * 0.62;
    ctx.font = `${size}px ${opts.font ?? fam}`;
    while (ctx.measureText(text).width > w * 0.92 && size > 20) {
      size -= 4;
      ctx.font = `${size}px ${opts.font ?? fam}`;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 6;
    ctx.fillStyle = color;
    ctx.fillText(text, w / 2, h / 2);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [text, color, opts.bg, opts.font, opts.w, opts.h]);
  useEffect(() => () => tex?.dispose(), [tex]);
  return tex;
}

/* ── Models ──────────────────────────────────────────── */
function Rose({ color, animate }: ModelProps) {
  const group = useRef<THREE.Group>(null);
  const bloom = useRef(animate && !prefersReducedMotion() ? 0 : 1);
  const petals = useMemo(() => {
    const arr: { ring: number; angle: number }[] = [];
    [5, 7, 9].forEach((n, ring) => {
      for (let i = 0; i < n; i++) arr.push({ ring, angle: (i / n) * Math.PI * 2 + ring * 0.4 });
    });
    return arr;
  }, []);
  const petalGeo = useMemo(() => new THREE.SphereGeometry(0.06, 14, 10, 0, Math.PI * 0.85, 0, Math.PI * 0.55), []);
  useEffect(() => () => petalGeo.dispose(), [petalGeo]);
  useFrame((_, dt) => {
    if (bloom.current >= 1 || !group.current) return;
    bloom.current = Math.min(1, bloom.current + dt * 1.1);
    group.current.children.forEach((child) => {
      const ud = child.userData as { ring?: number };
      if (ud.ring === undefined) return;
      const open = 0.15 + (0.25 + ud.ring * 0.38) * easeOutBack(bloom.current);
      child.rotation.x = open;
    });
  });
  const init = bloom.current;
  return (
    <group ref={group} position={[0, 0.045, 0]}>
      <mesh castShadow position={[0, 0.02, 0]} scale={[0.7, 1, 0.7]}>
        <sphereGeometry args={[0.035, 16, 12]} />
        <Mat color={color} />
      </mesh>
      {petals.map((p, i) => (
        <group key={i} rotation={[0, p.angle, 0]}>
          <mesh
            castShadow
            geometry={petalGeo}
            userData={{ ring: p.ring }}
            position={[0, 0, 0.012 + p.ring * 0.022]}
            rotation={[0.15 + (0.25 + p.ring * 0.38) * init, 0, 0]}
            scale={[1 + p.ring * 0.15, 1 - p.ring * 0.1, 0.7]}
          >
            <Mat color={color} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const easeOutBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

function Star({ color }: ModelProps) {
  const geo = useDisposable(useMemo(() => extrude(starShape(0.08, 0.036), 0.025), []));
  return (
    <mesh castShadow geometry={geo} position={[0, 0.07, 0]}>
      <Mat color={color} />
    </mesh>
  );
}

function Heart({ color }: ModelProps) {
  const geo = useDisposable(useMemo(() => extrude(heartShape(0.075), 0.03), []));
  return (
    <mesh castShadow geometry={geo} position={[0, 0.07, 0]} rotation={[0, 0, Math.PI]}>
      <Mat color={color} kind="glossy" />
    </mesh>
  );
}

function Figure({ body, skin = "#f1c9a5", dress = false, hair = "#3b2218", x = 0, tilt = 0, veil = false, height = 0.34 }: { body: string; skin?: string; dress?: boolean; hair?: string; x?: number; tilt?: number; veil?: boolean; height?: number }) {
  const h = height;
  return (
    <group position={[x, 0, 0]} rotation={[0, 0, tilt]}>
      {dress ? (
        <mesh castShadow position={[0, h * 0.32, 0]}>
          <coneGeometry args={[h * 0.3, h * 0.64, 24]} />
          <Mat color={body} kind="fondant" />
        </mesh>
      ) : (
        <>
          <mesh castShadow position={[0, h * 0.2, 0]}>
            <cylinderGeometry args={[h * 0.1, h * 0.12, h * 0.4, 16]} />
            <Mat color={body} kind="fondant" />
          </mesh>
          <mesh castShadow position={[0, h * 0.52, 0]}>
            <cylinderGeometry args={[h * 0.13, h * 0.1, h * 0.3, 16]} />
            <Mat color={body} kind="fondant" />
          </mesh>
        </>
      )}
      <mesh castShadow position={[0, h * 0.78, 0]}>
        <sphereGeometry args={[h * 0.12, 20, 16]} />
        <Mat color={skin} kind="fondant" />
      </mesh>
      <mesh castShadow position={[0, h * 0.84, -h * 0.02]} scale={[1, 0.7, 1]}>
        <sphereGeometry args={[h * 0.125, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <Mat color={hair} kind="matte" />
      </mesh>
      {veil && (
        <mesh position={[0, h * 0.62, -h * 0.05]}>
          <coneGeometry args={[h * 0.22, h * 0.5, 20, 1, true]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.45} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}
      {[-1, 1].map((s) => (
        <mesh key={s} castShadow position={[s * h * 0.14, h * 0.52, 0]} rotation={[0, 0, s * 0.25]}>
          <capsuleGeometry args={[h * 0.03, h * 0.22, 4, 8]} />
          <Mat color={dress ? skin : body} kind="fondant" />
        </mesh>
      ))}
    </group>
  );
}

function Couple({ color }: ModelProps) {
  const heartGeo = useDisposable(useMemo(() => extrude(heartShape(0.03), 0.01, 0.004), []));
  return (
    <group>
      <mesh receiveShadow position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.2, 0.21, 0.02, 32]} />
        <Mat color={isMetal(color) ? color : "#d4af37"} kind="metal" />
      </mesh>
      <Figure body={color === "#ffffff" ? "#1b1b1b" : "#3b2218"} x={-0.07} tilt={-0.06} />
      <Figure body={color} dress x={0.07} tilt={0.06} hair="#5a3020" />
      <mesh position={[0, 0.36, 0.02]} rotation={[0, 0, Math.PI]}>
        <primitive object={heartGeo} attach="geometry" />
        <Mat color="#c8102e" kind="glossy" />
      </mesh>
    </group>
  );
}

function BrideGroom({ color }: ModelProps) {
  return (
    <group>
      <mesh receiveShadow position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.2, 0.21, 0.02, 32]} />
        <Mat color="#d4af37" kind="metal" />
      </mesh>
      <Figure body="#1b1b1b" x={-0.075} height={0.38} />
      <mesh position={[-0.075, 0.2, 0.045]}>
        <boxGeometry args={[0.03, 0.08, 0.005]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <Figure body={color === "#3b1f14" ? "#f3e6d0" : color} dress veil x={0.075} height={0.36} hair="#6b3f2a" />
      <group position={[0.11, 0.2, 0.05]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[Math.cos(i * 2) * 0.012, Math.sin(i * 2) * 0.012, 0]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshStandardMaterial color="#f4a6c1" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function DancingCouple({ color }: ModelProps) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current && !prefersReducedMotion()) g.current.rotation.y = Math.sin(clock.elapsedTime * 0.8) * 0.4;
  });
  return (
    <group ref={g}>
      <mesh receiveShadow position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.19, 0.2, 0.02, 32]} />
        <Mat color="#d4af37" kind="metal" />
      </mesh>
      <Figure body="#1b1b1b" x={-0.05} tilt={-0.2} />
      <Figure body={color} dress x={0.05} tilt={0.3} hair="#3b2218" />
    </group>
  );
}

function Person({ color }: ModelProps) {
  return (
    <group>
      <Figure body={color} dress={["#f4a6c1", "#cdb4f0", "#f6d55c"].includes(color)} height={0.26} />
      <mesh castShadow position={[0, 0.3, 0]}>
        <coneGeometry args={[0.03, 0.08, 16]} />
        <meshStandardMaterial color="#f6d55c" />
      </mesh>
      <mesh position={[0, 0.345, 0]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial color="#c8102e" />
      </mesh>
    </group>
  );
}

function Teddy({ color }: ModelProps) {
  const dark = new THREE.Color(color).multiplyScalar(0.6).getStyle();
  return (
    <group>
      <mesh castShadow position={[0, 0.08, 0]} scale={[1, 1.1, 0.9]}>
        <sphereGeometry args={[0.075, 20, 16]} />
        <Mat color={color} kind="matte" />
      </mesh>
      <mesh castShadow position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.06, 20, 16]} />
        <Mat color={color} kind="matte" />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh castShadow position={[s * 0.045, 0.255, 0]}>
            <sphereGeometry args={[0.022, 12, 10]} />
            <Mat color={dark} kind="matte" />
          </mesh>
          <mesh castShadow position={[s * 0.075, 0.1, 0.02]}>
            <sphereGeometry args={[0.026, 12, 10]} />
            <Mat color={color} kind="matte" />
          </mesh>
          <mesh castShadow position={[s * 0.04, 0.025, 0.04]}>
            <sphereGeometry args={[0.03, 12, 10]} />
            <Mat color={color} kind="matte" />
          </mesh>
          <mesh position={[s * 0.02, 0.215, 0.052]}>
            <sphereGeometry args={[0.007, 8, 8]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.19, 0.05]}>
        <sphereGeometry args={[0.022, 12, 10]} />
        <Mat color="#f5e6d3" kind="matte" />
      </mesh>
      <mesh position={[0, 0.198, 0.07]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 0.145, 0.05]} rotation={[0.3, 0, 0]}>
        <torusGeometry args={[0.03, 0.008, 8, 20]} />
        <meshStandardMaterial color="#c8102e" />
      </mesh>
    </group>
  );
}

function CustomFigurine({ color }: ModelProps) {
  const r = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (r.current) r.current.rotation.y += dt * 0.6;
  });
  return (
    <group>
      <mesh castShadow position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.06, 32]} />
        <Mat color="#fffaf3" kind="fondant" />
      </mesh>
      <mesh ref={r} castShadow position={[0, 0.17, 0]}>
        <torusKnotGeometry args={[0.06, 0.018, 100, 12]} />
        <Mat color={color} kind="metal" />
      </mesh>
    </group>
  );
}

function Butterfly({ color }: ModelProps) {
  const l = useRef<THREE.Group>(null);
  const r = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (prefersReducedMotion()) return;
    const a = 0.5 + Math.sin(clock.elapsedTime * 3) * 0.25;
    if (l.current) l.current.rotation.y = a;
    if (r.current) r.current.rotation.y = -a;
  });
  return (
    <group position={[0, 0.06, 0]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.008, 0.07, 4, 8]} />
        <Mat color="#3b1f14" />
      </mesh>
      {[l, r].map((ref, i) => (
        <group ref={ref} key={i} rotation={[0, i ? -0.5 : 0.5, 0]}>
          <mesh castShadow position={[i ? 0.04 : -0.04, 0.02, 0]} scale={[1, 1.2, 1]}>
            <circleGeometry args={[0.04, 24]} />
            <meshPhysicalMaterial color={color} side={THREE.DoubleSide} roughness={0.3} clearcoat={0.5} iridescence={0.6} />
          </mesh>
          <mesh castShadow position={[i ? 0.03 : -0.03, -0.03, 0]}>
            <circleGeometry args={[0.026, 20]} />
            <meshPhysicalMaterial color={color} side={THREE.DoubleSide} roughness={0.3} iridescence={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Ball({ color }: ModelProps) {
  return (
    <mesh castShadow position={[0, 0.05, 0]}>
      <sphereGeometry args={[0.055, 24, 18]} />
      <Mat color={color} kind="glossy" />
    </mesh>
  );
}

function Leaf({ color }: ModelProps) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, -0.08);
    s.quadraticCurveTo(0.05, 0, 0, 0.08);
    s.quadraticCurveTo(-0.05, 0, 0, -0.08);
    return extrude(s, 0.006, 0.004);
  }, []);
  return (
    <mesh castShadow geometry={geo} position={[0, 0.05, 0]} rotation={[-0.7, 0, 0.4]}>
      <Mat color={color} />
    </mesh>
  );
}

function Ribbon({ color }: ModelProps) {
  const geo = useMemo(() => {
    const pts = Array.from({ length: 24 }, (_, i) => {
      const t = i / 23;
      return new THREE.Vector3(Math.cos(t * Math.PI * 3) * 0.06 * (1 - t * 0.4), 0.02 + t * 0.16, Math.sin(t * Math.PI * 3) * 0.06 * (1 - t * 0.4));
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.012, 8, false);
  }, []);
  return (
    <mesh castShadow geometry={geo} scale={[1, 1, 0.5]}>
      <Mat color={color} kind="glossy" />
    </mesh>
  );
}

function Letter({ color, label }: ModelProps) {
  const geo = useTextGeometry((label || "A").slice(0, 2), 0.11, 0.03);
  if (!geo) return null;
  return (
    <mesh castShadow geometry={geo}>
      <Mat color={color} />
    </mesh>
  );
}

function Crown({ color }: ModelProps) {
  return (
    <group>
      <mesh castShadow position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.09, 0.08, 0.08, 32, 1, true]} />
        <meshPhysicalMaterial color={color} metalness={0.95} roughness={0.22} side={THREE.DoubleSide} envMapIntensity={1.8} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * 0.088, 0.1, Math.sin(a) * 0.088]}>
            <mesh castShadow>
              <coneGeometry args={[0.022, 0.06, 8]} />
              <Mat color={color} kind="metal" />
            </mesh>
            <mesh position={[0, 0.035, 0]}>
              <sphereGeometry args={[0.01, 10, 8]} />
              <meshPhysicalMaterial color={i % 2 ? "#c8102e" : "#e6f7ff"} roughness={0.05} clearcoat={1} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Bar({ color }: ModelProps) {
  return (
    <group position={[0, 0.07, 0]} rotation={[0.2, 0, 0.15]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} castShadow position={[0, -0.05 + i * 0.05, 0]}>
          <boxGeometry args={[0.07, 0.045, 0.022]} />
          <Mat color={color} />
        </mesh>
      ))}
    </group>
  );
}

function Shard({ color }: ModelProps) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.05, 0);
    s.lineTo(0.06, 0);
    s.lineTo(0.02, 0.2);
    s.lineTo(-0.03, 0.12);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 1 });
    g.translate(0, -0.02, -0.006);
    return g;
  }, []);
  return (
    <mesh castShadow geometry={geo} rotation={[0, 0, 0.12]}>
      <Mat color={color} kind="glossy" />
    </mesh>
  );
}

function Flower({ color }: ModelProps) {
  return (
    <group position={[0, 0.02, 0]}>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} castShadow position={[Math.cos(a) * 0.035, 0, Math.sin(a) * 0.035]} rotation={[0, -a, 0.35]} scale={[1.2, 0.35, 0.85]}>
            <sphereGeometry args={[0.035, 14, 10]} />
            <Mat color={color} kind="fondant" />
          </mesh>
        );
      })}
      <mesh position={[0, 0.01, 0]}>
        <sphereGeometry args={[0.018, 12, 10]} />
        <meshStandardMaterial color="#f6c90e" roughness={0.6} />
      </mesh>
    </group>
  );
}

function Sunflower({ color }: ModelProps) {
  return (
    <group position={[0, 0.02, 0]}>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <mesh key={i} castShadow position={[Math.cos(a) * 0.06, 0, Math.sin(a) * 0.06]} rotation={[0, -a, 0.15]} scale={[1.6, 0.25, 0.5]}>
            <sphereGeometry args={[0.03, 10, 8]} />
            <Mat color={color} kind="fondant" />
          </mesh>
        );
      })}
      <mesh position={[0, 0.008, 0]} scale={[1, 0.4, 1]}>
        <sphereGeometry args={[0.045, 20, 12]} />
        <meshStandardMaterial color="#4a2a1c" roughness={0.95} />
      </mesh>
    </group>
  );
}

function Orchid({ color }: ModelProps) {
  return (
    <group position={[0, 0.03, 0]} rotation={[0.5, 0, 0]}>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} castShadow position={[Math.cos(a) * 0.05, 0, Math.sin(a) * 0.05]} rotation={[0, -a, 0.1]} scale={[1.8, 0.2, 1.1]}>
            <sphereGeometry args={[0.035, 14, 10]} />
            <Mat color={color} kind="fondant" />
          </mesh>
        );
      })}
      <mesh position={[0, 0.015, 0.03]} scale={[1, 0.8, 1.3]}>
        <sphereGeometry args={[0.022, 12, 10]} />
        <meshStandardMaterial color="#9b1b5a" />
      </mesh>
    </group>
  );
}

function Lotus({ color }: ModelProps) {
  return (
    <group>
      {[0, 1].map((ring) =>
        Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2 + ring * 0.4;
          return (
            <group key={`${ring}-${i}`} rotation={[0, a, 0]}>
              <mesh castShadow position={[0, 0.045 + ring * 0.01, 0.04 - ring * 0.015]} rotation={[0.5 - ring * 0.25, 0, 0]} scale={[0.55, 1, 0.3]}>
                <sphereGeometry args={[0.06, 14, 10]} />
                <Mat color={ring ? color : new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.4).getStyle()} kind="fondant" />
              </mesh>
            </group>
          );
        })
      )}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.02, 16]} />
        <meshStandardMaterial color="#f6c90e" />
      </mesh>
    </group>
  );
}

function GoldLeaf({ color }: ModelProps) {
  const flakes = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        p: [(Math.random() - 0.5) * 0.12, 0.004 + i * 0.002, (Math.random() - 0.5) * 0.12] as [number, number, number],
        r: [Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.4] as [number, number, number],
        s: 0.03 + Math.random() * 0.04,
      })),
    []
  );
  return (
    <group>
      {flakes.map((f, i) => (
        <mesh key={i} position={f.p} rotation={f.r} scale={[1, 0.08, 1]} castShadow>
          <icosahedronGeometry args={[f.s, 0]} />
          <meshPhysicalMaterial color={color} metalness={1} roughness={0.3} envMapIntensity={2} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Pearls({ color }: ModelProps) {
  const pts = useMemo(() => Array.from({ length: 6 }, (_, i) => [Math.cos(i * 1.1) * 0.035 * (i % 3), 0.016, Math.sin(i * 1.1) * 0.035 * (i % 3)] as [number, number, number]), []);
  return (
    <group>
      {pts.map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <sphereGeometry args={[0.017 + (i % 2) * 0.005, 16, 12]} />
          <meshPhysicalMaterial color={color} metalness={0.6} roughness={0.15} clearcoat={1} iridescence={0.4} envMapIntensity={1.6} />
        </mesh>
      ))}
    </group>
  );
}

function Diamond({ color }: ModelProps) {
  return (
    <mesh castShadow position={[0, 0.05, 0]} scale={[1, 1.35, 1]}>
      <octahedronGeometry args={[0.04, 0]} />
      <meshPhysicalMaterial color={color} metalness={0.2} roughness={0.02} clearcoat={1} iridescence={1} iridescenceIOR={1.8} envMapIntensity={3} flatShading />
    </mesh>
  );
}

function Strawberry({ color }: ModelProps) {
  return (
    <group rotation={[0.3, 0, 0.2]}>
      <mesh castShadow position={[0, 0.04, 0]} rotation={[Math.PI, 0, 0]} scale={[1, 1.25, 1]}>
        <sphereGeometry args={[0.04, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        <Mat color={color} kind="fruit" />
      </mesh>
      <mesh castShadow position={[0, 0.032, 0]}>
        <sphereGeometry args={[0.038, 20, 14]} />
        <Mat color={color} kind="fruit" />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[Math.cos(i * 1.256) * 0.02, 0.072, Math.sin(i * 1.256) * 0.02]} rotation={[0, -i * 1.256, 0.9]} scale={[1, 0.25, 0.5]}>
          <sphereGeometry args={[0.022, 8, 6]} />
          <meshStandardMaterial color="#3f8f3a" />
        </mesh>
      ))}
    </group>
  );
}

function Blueberry({ color }: ModelProps) {
  return (
    <group>
      {[[0, 0.022, 0], [0.04, 0.02, 0.01], [0.015, 0.02, 0.038], [0.02, 0.05, 0.015]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow>
          <sphereGeometry args={[0.022, 16, 12]} />
          <meshPhysicalMaterial color={color} roughness={0.55} sheen={0.8} sheenColor="#a0a8d8" />
        </mesh>
      ))}
    </group>
  );
}

function Cherry({ color }: ModelProps) {
  const stem = useMemo(() => new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0.06, 0), new THREE.Vector3(0.01, 0.1, 0), new THREE.Vector3(0.04, 0.13, 0)), 12, 0.003, 6), []);
  return (
    <group>
      <mesh castShadow position={[0, 0.035, 0]}>
        <sphereGeometry args={[0.035, 20, 16]} />
        <Mat color={color} kind="fruit" />
      </mesh>
      <mesh geometry={stem}>
        <meshStandardMaterial color="#4a6b2a" />
      </mesh>
    </group>
  );
}

function Raspberry({ color }: ModelProps) {
  const pts = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < 26; i++) {
      const y = 1 - (i / 25) * 1.6;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const a = i * 2.4;
      arr.push([Math.cos(a) * r * 0.028, 0.035 + y * 0.03, Math.sin(a) * r * 0.028]);
    }
    return arr;
  }, []);
  return (
    <group>
      {pts.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.012, 8, 6]} />
          <Mat color={color} kind="fruit" />
        </mesh>
      ))}
    </group>
  );
}

function Mango({ color }: ModelProps) {
  return (
    <group rotation={[0, 0, 0]}>
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={i} castShadow position={[0, 0.03, 0]} rotation={[0.9, (i - 1.5) * 0.35, 0]}>
          <boxGeometry args={[0.03, 0.12, 0.018]} />
          <Mat color={color} kind="fruit" />
        </mesh>
      ))}
    </group>
  );
}

function MixedFruit({ color }: ModelProps) {
  return (
    <group>
      <group position={[-0.05, 0, 0]}>
        <Strawberry color={color} />
      </group>
      <group position={[0.05, 0, -0.03]}>
        <Blueberry color="#3a3f8f" />
      </group>
      <mesh castShadow position={[0.02, 0.03, 0.06]} rotation={[1.2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.012, 24]} />
        <meshPhysicalMaterial color="#8bc34a" roughness={0.3} clearcoat={1} />
      </mesh>
      <mesh castShadow position={[-0.02, 0.03, -0.06]} rotation={[1.0, 0.4, 0]}>
        <cylinderGeometry args={[0.033, 0.033, 0.012, 24]} />
        <meshPhysicalMaterial color="#ff9f1c" roughness={0.3} clearcoat={1} />
      </mesh>
    </group>
  );
}

function Flame({ y }: { y: number }) {
  const f = useRef<THREE.Mesh>(null);
  const seed = useMemo(() => Math.random() * 10, []);
  useFrame(({ clock }) => {
    if (!f.current) return;
    const t = clock.elapsedTime * 9 + seed;
    const k = prefersReducedMotion() ? 1 : 1 + Math.sin(t) * 0.12 + Math.sin(t * 2.3) * 0.08;
    f.current.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k));
    f.current.rotation.z = prefersReducedMotion() ? 0 : Math.sin(t * 0.7) * 0.08;
  });
  return (
    <group position={[0, y, 0]}>
      <mesh ref={f} position={[0, 0.018, 0]}>
        <sphereGeometry args={[0.011, 12, 10]} />
        <meshBasicMaterial color="#ffd27a" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.02, 0]} scale={[1, 1.8, 1]}>
        <sphereGeometry args={[0.02, 12, 10]} />
        <meshBasicMaterial color="#ff9b3d" transparent opacity={0.28} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Candle({ color }: ModelProps) {
  return (
    <group>
      <mesh castShadow position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.009, 0.009, 0.14, 12]} />
        <Mat color={color} kind="glossy" />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[0, 0.015 + i * 0.027, 0]} rotation={[0.35, 0, 0]}>
          <torusGeometry args={[0.0095, 0.0025, 6, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
      <mesh position={[0, 0.148, 0]}>
        <cylinderGeometry args={[0.0015, 0.0015, 0.014, 4]} />
        <meshBasicMaterial color="#222" />
      </mesh>
      <Flame y={0.152} />
    </group>
  );
}

function NumberCandle({ color, label }: ModelProps) {
  const text = (label || "1").slice(0, 3);
  const geo = useTextGeometry(text, 0.16, 0.045);
  const width = useMemo(() => {
    if (!geo) return 0;
    geo.computeBoundingBox();
    return geo.boundingBox!.max.x - geo.boundingBox!.min.x;
  }, [geo]);
  if (!geo) return null;
  return (
    <group>
      <mesh castShadow geometry={geo}>
        <meshPhysicalMaterial color={color} metalness={0.7} roughness={0.35} clearcoat={0.8} iridescence={0.3} envMapIntensity={1.6} />
      </mesh>
      {Array.from({ length: text.length }, (_, i) => {
        const x = -width / 2 + (width / text.length) * (i + 0.5);
        return (
          <group key={i} position={[x, 0.165, 0]}>
            <mesh>
              <cylinderGeometry args={[0.0015, 0.0015, 0.014, 4]} />
              <meshBasicMaterial color="#222" />
            </mesh>
            <Flame y={0.004} />
          </group>
        );
      })}
    </group>
  );
}

function Topper({ color, label }: ModelProps) {
  const tex = useLabelTexture(label || "Celebrate", color);
  return (
    <group>
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} castShadow position={[x, 0.12, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.26, 6]} />
          <Mat color={color} kind="metal" />
        </mesh>
      ))}
      {tex && (
        <mesh position={[0, 0.3, 0]} castShadow>
          <planeGeometry args={[0.5, 0.156]} />
          <meshPhysicalMaterial map={tex} transparent alphaTest={0.1} metalness={isMetal(color) ? 0.85 : 0.2} roughness={0.3} side={THREE.DoubleSide} envMapIntensity={1.8} />
        </mesh>
      )}
    </group>
  );
}

function Ring({ color }: ModelProps) {
  return (
    <group position={[0, 0.075, 0]}>
      <mesh castShadow>
        <torusGeometry args={[0.06, 0.012, 16, 48]} />
        <Mat color={color} kind="metal" />
      </mesh>
      <mesh castShadow position={[0, 0.082, 0]} scale={[1, 1.2, 1]}>
        <octahedronGeometry args={[0.028, 0]} />
        <meshPhysicalMaterial color="#e6f7ff" roughness={0.02} clearcoat={1} iridescence={1} envMapIntensity={3} flatShading />
      </mesh>
    </group>
  );
}

function Balloon({ color }: ModelProps) {
  return (
    <group>
      <mesh castShadow position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.002, 0.002, 0.16, 4]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      <mesh castShadow position={[0, 0.2, 0]} scale={[1, 1.18, 1]}>
        <sphereGeometry args={[0.05, 24, 18]} />
        <Mat color={color} kind="glossy" />
      </mesh>
      <mesh position={[0, 0.145, 0]}>
        <coneGeometry args={[0.01, 0.015, 8]} />
        <Mat color={color} kind="glossy" />
      </mesh>
    </group>
  );
}

function Bell({ color }: ModelProps) {
  const geo = useMemo(() => {
    const pts = [new THREE.Vector2(0, 0.11), new THREE.Vector2(0.02, 0.105), new THREE.Vector2(0.03, 0.08), new THREE.Vector2(0.035, 0.04), new THREE.Vector2(0.05, 0.01), new THREE.Vector2(0.055, 0)];
    return new THREE.LatheGeometry(pts, 32);
  }, []);
  return (
    <group>
      <mesh castShadow geometry={geo}>
        <meshPhysicalMaterial color={color} metalness={isMetal(color) ? 0.9 : 0.1} roughness={0.25} side={THREE.DoubleSide} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 0.008, 0]}>
        <sphereGeometry args={[0.012, 10, 8]} />
        <Mat color={color} kind="metal" />
      </mesh>
      <mesh position={[0, 0.115, 0]}>
        <torusGeometry args={[0.012, 0.003, 6, 16]} />
        <Mat color="#f4a6c1" kind="glossy" />
      </mesh>
    </group>
  );
}

function Rainbow() {
  const colors = ["#f28c8c", "#f6c48a", "#f6e58a", "#9fe0a8", "#9fc8f0", "#c7a8f0"];
  return (
    <group>
      {colors.map((c, i) => (
        <mesh key={c} castShadow rotation={[0, 0, 0]} position={[0, 0, 0]}>
          <torusGeometry args={[0.16 - i * 0.02, 0.01, 10, 40, Math.PI]} />
          <Mat color={c} kind="fondant" />
        </mesh>
      ))}
      {[-0.13, 0.13].map((x) => (
        <group key={x} position={[x, 0.02, 0]}>
          {[[0, 0, 0], [0.025, 0.012, 0], [-0.025, 0.008, 0], [0, 0.025, 0]].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]}>
              <sphereGeometry args={[0.025, 12, 10]} />
              <Mat color="#ffffff" kind="fondant" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Plaque({ color, label }: ModelProps) {
  const textColor = color === "#3b1f14" ? "#f3e6d0" : "#5c2b1b";
  const tex = useLabelTexture(label || "Forever", textColor, { w: 1024, h: 400 });
  return (
    <group position={[0, 0.07, 0]} rotation={[-0.35, 0, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.13, 0.018]} />
        <Mat color={color} kind="choc" />
      </mesh>
      {tex && (
        <mesh position={[0, 0, 0.0101]}>
          <planeGeometry args={[0.28, 0.11]} />
          <meshStandardMaterial map={tex} transparent polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      )}
    </group>
  );
}

export const MODEL_COMPONENTS: Partial<Record<DecorationModel, (p: ModelProps) => React.ReactElement | null>> = {
  rose: Rose,
  star: Star,
  heart: Heart,
  couple: Couple,
  "bride-groom": BrideGroom,
  "dancing-couple": DancingCouple,
  person: Person,
  teddy: Teddy,
  "custom-figurine": CustomFigurine,
  butterfly: Butterfly,
  ball: Ball,
  leaf: Leaf,
  ribbon: Ribbon,
  letter: Letter,
  crown: Crown,
  bar: Bar,
  shard: Shard,
  flower: Flower,
  sunflower: Sunflower,
  orchid: Orchid,
  lotus: Lotus,
  "gold-leaf": GoldLeaf,
  pearls: Pearls,
  diamond: Diamond,
  strawberry: Strawberry,
  blueberry: Blueberry,
  cherry: Cherry,
  raspberry: Raspberry,
  mango: Mango,
  "mixed-fruit": MixedFruit,
  candle: Candle,
  "number-candle": NumberCandle,
  topper: Topper,
  ring: Ring,
  balloon: Balloon,
  bell: Bell,
  rainbow: Rainbow,
  plaque: Plaque,
};

export { Rose as RoseModel, Star as StarModel, Strawberry as StrawberryModel, Heart as HeartModel };
