"use client";
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { CakeConfig, DecorationDef, PlacedDecoration } from "@/types/cake";
import type { TierLayout } from "@/lib/cake/dimensions";
import { getDecoration, SIZE_FACTOR } from "@/data/decorations";
import { MODEL_COMPONENTS } from "./DecorationModels";
import { decorationTransform } from "./placement";
import { raycastDown, tierMeshes } from "./registry";
import { topHeightAt } from "./geometry";
import { useCakeStore } from "@/store/cakeStore";
import { prefersReducedMotion } from "@/lib/utils";
import { dragState } from "./dragState";

/* ── GLB / GLTF support with procedural fallback ─────── */
class ModelErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function GltfModel({ url, color }: { url: string; color: string }) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        if (m.material && "color" in (m.material as THREE.MeshStandardMaterial) && m.userData.tintable !== false) {
          m.material = (m.material as THREE.MeshStandardMaterial).clone();
          (m.material as THREE.MeshStandardMaterial).color.set(color);
        }
      }
    });
    return c;
  }, [scene, color]);
  return <primitive object={clone} />;
}

function ProceduralModel({ def, deco, animate }: { def: DecorationDef; deco: PlacedDecoration; animate: boolean }) {
  const C = MODEL_COMPONENTS[def.model];
  if (!C) return null;
  return <C color={deco.color} label={deco.label} animate={animate} />;
}

/* ── one placed decoration ───────────────────────────── */
function DecorationMesh({ deco, def, layouts, shape, interactive, selected }: { deco: PlacedDecoration; def: DecorationDef; layouts: TierLayout[]; shape: CakeConfig["shape"]; interactive: boolean; selected: boolean }) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const spawn = useRef(interactive && !prefersReducedMotion() ? 0 : 1);
  const controls = useThree((s) => s.controls) as unknown as { enabled: boolean } | null;
  const [hover, setHover] = useState(false);
  const tf = decorationTransform(deco, layouts, shape, def.model);
  const s = SIZE_FACTOR[deco.size] * deco.scale;

  useFrame((_, dt) => {
    if (!inner.current) return;
    if (spawn.current < 1) {
      spawn.current = Math.min(1, spawn.current + dt * 2.2);
      const t = spawn.current;
      const e = 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2); // easeOutBack
      inner.current.scale.setScalar(Math.max(0.001, e * s));
      inner.current.position.y = (1 - t) * 0.6;
    } else {
      inner.current.scale.setScalar(s);
      inner.current.position.y = 0;
    }
  });

  if (!tf) return null;

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive) return;
    e.stopPropagation();
    const st = useCakeStore.getState();
    if (st.armedDecoration) return;
    st.select(deco.uid);
    dragState.uid = deco.uid;
    dragState.moved = false;
    st.beginTransient();
    if (controls) controls.enabled = false;
    (e.target as Element | null)?.setPointerCapture?.(e.pointerId);
  };

  const ringR = Math.max(0.06, def.radius * 1.15);

  return (
    <group ref={group} position={tf.position} quaternion={tf.quaternion}>
      <group
        ref={inner}
        onPointerDown={onDown}
        onPointerOver={interactive ? (e) => (e.stopPropagation(), setHover(true), (document.body.style.cursor = "grab")) : undefined}
        onPointerOut={interactive ? () => (setHover(false), (document.body.style.cursor = "")) : undefined}
      >
        {def.modelUrl ? (
          <ModelErrorBoundary fallback={<ProceduralModel def={def} deco={deco} animate />}>
            <Suspense fallback={<ProceduralModel def={def} deco={deco} animate={false} />}>
              <GltfModel url={def.modelUrl} color={deco.color} />
            </Suspense>
          </ModelErrorBoundary>
        ) : (
          <ProceduralModel def={def} deco={deco} animate={interactive} />
        )}
      </group>
      {interactive && (selected || hover) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} raycast={() => null}>
          <ringGeometry args={[ringR * s, ringR * s + 0.018, 48]} />
          <meshBasicMaterial color={selected ? "#e8a598" : "#ffffff"} transparent opacity={selected ? 0.95 : 0.5} toneMapped={false} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

/* ── scatter decorations (sprinkles, confetti, glitter) — instanced & falling ── */
const SPRINKLE_COLORS = ["#f28c8c", "#f6c48a", "#f6e58a", "#9fe0a8", "#9fc8f0", "#c7a8f0", "#ffffff"];
const tmpObj = new THREE.Object3D();

function ScatterLayer({ deco, def, layout, shape, interactive }: { deco: PlacedDecoration; def: DecorationDef; layout: TierLayout; shape: CakeConfig["shape"]; interactive: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = def.model === "glitter" ? 420 : def.model === "confetti" ? 140 : 300;
  const geo = useMemo(() => {
    if (def.model === "sprinkles") return new THREE.CapsuleGeometry(0.0055, 0.022, 2, 6);
    if (def.model === "confetti") return new THREE.CylinderGeometry(0.014, 0.014, 0.003, 10);
    return new THREE.OctahedronGeometry(0.006, 0);
  }, [def.model]);
  useEffect(() => () => geo.dispose(), [geo]);

  const [targets, setTargets] = useState<{ p: THREE.Vector3; r: THREE.Euler; y0: number; v: number; landed: boolean }[]>([]);
  const animating = useRef(false);
  const hasFallen = useRef(false);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  useEffect(() => {
    const layout = layoutRef.current;
    let raf = 0;
    let tries = 0;
    const compute = () => {
      const hasMesh = interactive && tierMeshes.has(deco.tierIndex);
      if (interactive && !hasMesh && tries++ < 20) {
        raf = requestAnimationFrame(compute);
        return;
      }
      let s = 1234 + deco.uid.length * 77;
      const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      const out: typeof targets = [];
      let guard = 0;
      while (out.length < count && guard++ < count * 8) {
        const x = (rnd() - 0.5) * layout.width;
        const z = (rnd() - 0.5) * layout.depth;
        let y: number | null = null;
        if (hasMesh) {
          const hit = raycastDown(x, z);
          if (hit && hit.tierIndex === deco.tierIndex && hit.normal.y > 0.4) y = layout.y + topHeightAt(shape, layout, x, z);
        } else if ((x * x) / ((layout.width / 2) ** 2) + (z * z) / ((layout.depth / 2) ** 2) < 0.85) {
          y = layout.y + topHeightAt(shape, layout, x, z);
        }
        if (y === null) continue;
        const reduced = prefersReducedMotion() || !interactive || hasFallen.current;
        out.push({
          p: new THREE.Vector3(x, y + 0.004, z),
          r: new THREE.Euler(def.model === "sprinkles" ? Math.PI / 2 : rnd() * 0.3, rnd() * Math.PI * 2, rnd() * 0.3),
          y0: reduced ? y + 0.004 : y + 0.8 + rnd() * 1.4,
          v: 0,
          landed: reduced,
        });
      }
      animating.current = true;
      hasFallen.current = true;
      setTargets(out);
    };
    raf = requestAnimationFrame(compute);
    return () => cancelAnimationFrame(raf);
  }, [layout.width, layout.depth, layout.y, layout.height, shape, deco.tierIndex, deco.uid, count, interactive, def.model]);

  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const c = new THREE.Color();
    const base = new THREE.Color(deco.color);
    targets.forEach((t, i) => {
      if (def.model === "glitter") c.copy(base).offsetHSL(0, 0, (i % 5) * 0.03);
      else c.set(SPRINKLE_COLORS[i % SPRINKLE_COLORS.length]);
      m.setColorAt(i, c);
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [targets, deco.color, def.model]);

  useFrame((_, dt) => {
    const m = ref.current;
    if (!m || !animating.current) return;
    let moving = false;
    targets.forEach((t, i) => {
      if (!t.landed) {
        t.v += 9.8 * dt * 0.35;
        t.y0 -= t.v * dt;
        if (t.y0 <= t.p.y) {
          t.y0 = t.p.y;
          t.landed = true;
        } else moving = true;
      }
      tmpObj.position.set(t.p.x, t.y0, t.p.z);
      tmpObj.rotation.copy(t.r);
      tmpObj.updateMatrix();
      m.setMatrixAt(i, tmpObj.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    if (!moving) animating.current = false;
  });

  if (!targets.length) return null;
  return (
    <instancedMesh ref={ref} args={[geo, undefined, targets.length]} key={targets.length} raycast={() => null}>
      <meshPhysicalMaterial
        roughness={def.model === "glitter" ? 0.15 : 0.35}
        metalness={def.model === "glitter" ? 0.9 : 0}
        clearcoat={0.6}
        envMapIntensity={def.model === "glitter" ? 2.5 : 1}
        flatShading={def.model === "glitter"}
      />
    </instancedMesh>
  );
}

export function DecorationLayer({ config, layouts, interactive }: { config: CakeConfig; layouts: TierLayout[]; interactive: boolean }) {
  const selectedUid = useCakeStore((s) => (interactive ? s.selectedUid : null));
  return (
    <group>
      {config.decorations.map((d) => {
        const def = getDecoration(d.decorationId);
        if (!def) return null;
        const layout = layouts[Math.min(d.tierIndex, layouts.length - 1)];
        if (def.placement === "scatter")
          return <ScatterLayer key={d.uid} deco={d} def={def} layout={layout} shape={config.shape} interactive={interactive} />;
        return <DecorationMesh key={d.uid} deco={d} def={def} layouts={layouts} shape={config.shape} interactive={interactive} selected={selectedUid === d.uid} />;
      })}
    </group>
  );
}
