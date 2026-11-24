"use client";
/** Non-interactive cinematic cake presentation (hero, review, confirmation, cards). */
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Float, OrbitControls, Sparkles } from "@react-three/drei";
import type { CakeConfig } from "@/types/cake";
import { computeTierLayout, totalHeight } from "@/lib/cake/dimensions";
import { CakeModel } from "./CakeModel";
import { Lights } from "./CakeScene";
import { standBottom } from "./CakeExtras";
import { HeartModel, RoseModel, StarModel, StrawberryModel } from "./DecorationModels";
import { prefersReducedMotion } from "@/lib/utils";

function Spinner({ children, speed = 0.25, scroll }: { children: React.ReactNode; speed?: number; scroll?: React.MutableRefObject<number> }) {
  const g = useRef<THREE.Group>(null);
  const reduced = useMemo(() => prefersReducedMotion(), []);
  useFrame((_, dt) => {
    if (!g.current) return;
    if (!reduced) g.current.rotation.y += dt * speed;
    if (scroll) {
      const p = scroll.current;
      g.current.rotation.x = THREE.MathUtils.lerp(g.current.rotation.x, p * 0.35, 0.08);
      g.current.position.y = THREE.MathUtils.lerp(g.current.position.y, -p * 0.8, 0.08);
      const s = 1 - p * 0.18;
      g.current.scale.lerp(new THREE.Vector3(s, s, s), 0.08);
      if (!reduced) g.current.rotation.y += dt * p * 2;
    }
  });
  return <group ref={g}>{children}</group>;
}

function FallingSprinkles({ count = 160, area = 9 }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * area,
        y: Math.random() * 8 - 2,
        z: (Math.random() - 0.5) * area * 0.6 - 1,
        s: 0.3 + Math.random() * 0.5,
        r: Math.random() * Math.PI,
        c: ["#f28c8c", "#f6e58a", "#9fe0a8", "#9fc8f0", "#c7a8f0", "#ffffff", "#e8a598"][Math.floor(Math.random() * 7)],
      })),
    [count, area]
  );
  const geo = useMemo(() => new THREE.CapsuleGeometry(0.012, 0.05, 2, 6), []);
  const o = useMemo(() => new THREE.Object3D(), []);
  const colored = useRef(false);
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    if (!colored.current) {
      data.forEach((d, i) => m.setColorAt(i, new THREE.Color(d.c)));
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      colored.current = true;
    }
    data.forEach((d, i) => {
      d.y -= dt * d.s * 0.6;
      d.r += dt * d.s;
      if (d.y < -3) d.y = 5;
      o.position.set(d.x, d.y, d.z);
      o.rotation.set(d.r, d.r * 0.7, 0);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[geo, undefined, count]}>
      <meshStandardMaterial roughness={0.4} />
    </instancedMesh>
  );
}

function FloatingDecor() {
  const items: { pos: [number, number, number]; el: React.ReactNode; s: number }[] = [
    { pos: [-2.6, 1.8, -0.5], el: <RoseModel color="#7a1022" />, s: 3.2 },
    { pos: [2.7, 2.4, -1], el: <StarModel color="#d4af37" />, s: 3.5 },
    { pos: [-2.2, -0.4, 0.8], el: <StrawberryModel color="#d7263d" />, s: 3.4 },
    { pos: [2.4, 0.2, 0.6], el: <RoseModel color="#f4a6c1" />, s: 2.8 },
    { pos: [-1.2, 3.1, -1.2], el: <HeartModel color="#c8102e" />, s: 3 },
    { pos: [1.4, 3.3, -0.4], el: <StarModel color="#f3e6d0" />, s: 2.4 },
  ];
  return (
    <>
      {items.map((it, i) => (
        <Float key={i} speed={1.4 + i * 0.2} rotationIntensity={1.2} floatIntensity={1.4}>
          <group position={it.pos} scale={it.s} rotation={[0.3, i, 0.2]}>
            {it.el}
          </group>
        </Float>
      ))}
      {/* chocolate pieces & ribbon */}
      {[[-3, 0.9, -1.5], [3.1, 1.2, -1.8], [0.4, 3.6, -2]].map((p, i) => (
        <Float key={`c${i}`} speed={1.8} rotationIntensity={2} floatIntensity={1}>
          <mesh position={p as [number, number, number]} rotation={[0.4, i, 0.6]} castShadow>
            <boxGeometry args={[0.32, 0.2, 0.08]} />
            <meshPhysicalMaterial color="#3b1f14" roughness={0.3} clearcoat={0.8} />
          </mesh>
        </Float>
      ))}
      <Float speed={1.2} rotationIntensity={0.6} floatIntensity={0.8}>
        <mesh position={[-2.9, 2.8, -2]} rotation={[0.6, 0.3, 0.2]}>
          <torusKnotGeometry args={[0.22, 0.05, 120, 12, 2, 3]} />
          <meshPhysicalMaterial color="#5c3a28" roughness={0.25} clearcoat={1} />
        </mesh>
      </Float>
    </>
  );
}

export default function CakeShowcase({
  config,
  hero = false,
  scroll,
  interactiveOrbit = true,
  className,
}: {
  config: CakeConfig;
  hero?: boolean;
  scroll?: React.MutableRefObject<number>;
  interactiveOrbit?: boolean;
  className?: string;
}) {
  const layouts = useMemo(() => computeTierLayout(config), [config]);
  const H = totalHeight(layouts);
  const W = Math.max(layouts[0].width, layouts[0].depth);
  const dist = 2.4 + W * 1.25 + H * 0.9;
  return (
    <Canvas
      className={className}
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, H * 0.6 + dist * 0.38, dist], fov: hero ? 38 : 34 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
    >
      <Lights />
      <group position={[0, hero ? -H * 0.35 : 0, 0]}>
        <Spinner speed={hero ? 0.35 : 0.25} scroll={scroll}>
          <CakeModel config={config} assemble />
          <ContactShadows position={[0, standBottom(config.extras.basePlate) - 0.001, 0]} opacity={0.5} scale={7} blur={2.6} far={4} color="#1a0d08" />
        </Spinner>
      </group>
      {hero && (
        <>
          <FloatingDecor />
          <FallingSprinkles />
          <Sparkles count={70} scale={[9, 6, 4]} size={3} speed={0.35} color="#f4c7c3" opacity={0.8} />
          <Sparkles count={40} scale={[8, 6, 3]} size={5} speed={0.2} color="#d4af37" />
        </>
      )}
      {interactiveOrbit && <OrbitControls enablePan={false} enableZoom={!hero} target={[0, hero ? 0 : H * 0.42, 0]} maxPolarAngle={Math.PI * 0.55} minDistance={2.5} maxDistance={12} />}
    </Canvas>
  );
}
