"use client";
/**
 * CakeScene — the interactive studio canvas.
 * Handles lighting, environment reflections, camera presets, raycast placement,
 * drag-to-reposition, surface snapping and screenshots.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, PerformanceMonitor, AdaptiveDpr } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useCakeStore, sceneBridge } from "@/store/cakeStore";
import { computeTierLayout, totalHeight, type TierLayout } from "@/lib/cake/dimensions";
import { getDecoration } from "@/data/decorations";
import { findCollisions } from "@/lib/cake/validation";
import type { CakeConfig, PlacedDecoration } from "@/types/cake";
import { CakeModel } from "./CakeModel";
import { standBottom } from "./CakeExtras";
import { hitToPlacement } from "./placement";
import { raycastDown, raycastFromCamera, tierMeshes } from "./registry";
import { dragState } from "./dragState";
import { getLoadedFont } from "./geometry";
import { toast } from "@/store/appStore";
import { defaultRotation } from "@/lib/cake/defaults";

/* ── Camera presets & smooth transitions ─────────────── */
function CameraRig({ layouts }: { layouts: TierLayout[] }) {
  const { camera } = useThree();
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const view = useCakeStore((s) => s.cameraView);
  const nonce = useCakeStore((s) => s.cameraNonce);
  const anim = useRef<{ pos: THREE.Vector3; active: boolean }>({ pos: new THREE.Vector3(), active: false });
  const H = totalHeight(layouts);
  const W = Math.max(layouts[0]?.width ?? 2, layouts[0]?.depth ?? 2);
  const target = useMemo(() => new THREE.Vector3(0, H * 0.42, 0), [H]);

  useEffect(() => {
    const dist = 2.2 + W * 1.25 + H * 0.9;
    const y = H * 0.5;
    const pos = {
      front: new THREE.Vector3(0, y + 0.35, dist),
      side: new THREE.Vector3(dist, y + 0.35, 0),
      top: new THREE.Vector3(0, H + dist * 1.2, 0.001),
      iso: new THREE.Vector3(dist * 0.6, y + dist * 0.42, dist * 0.78),
      free: camera.position.clone(),
    }[view];
    anim.current = { pos, active: view !== "free" };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, nonce]);

  useEffect(() => {
    if (!controls) return;
    const stop = () => (anim.current.active = false);
    controls.addEventListener("start", stop);
    return () => controls.removeEventListener("start", stop);
  }, [controls]);

  useFrame((_, dt) => {
    if (!controls) return;
    const k = 1 - Math.exp(-dt * 4);
    controls.target.lerp(target, k);
    if (anim.current.active) {
      camera.position.lerp(anim.current.pos, k);
      if (camera.position.distanceTo(anim.current.pos) < 0.01) anim.current.active = false;
    }
    controls.update();
  });
  return null;
}

/* ── Surface snapping: validates pending decorations against real geometry ── */
function SnapResolver({ config, layouts }: { config: CakeConfig; layouts: TierLayout[] }) {
  const pending = config.decorations.filter((d) => d.pendingSnap);
  const key = pending.map((d) => d.uid).join(",");
  useEffect(() => {
    if (!pending.length) return;
    let raf = 0;
    let tries = 0;
    const textShape = config.shape === "number" || config.shape === "letter";
    const run = () => {
      const ready = tierMeshes.size >= config.tiers.length && (!textShape || getLoadedFont());
      if (!ready && tries++ < 60) {
        raf = requestAnimationFrame(run);
        return;
      }
      const st = useCakeStore.getState();
      const working: CakeConfig = { ...st.config, decorations: [...st.config.decorations] };
      const patches = new Map<string, Partial<PlacedDecoration>>();
      for (const d of working.decorations) {
        if (!d.pendingSnap) continue;
        if (d.surface !== "top") {
          patches.set(d.uid, { pendingSnap: false });
          continue;
        }
        const l = layouts[d.tierIndex] ?? layouts[layouts.length - 1];
        const valid = (u: number, v: number, checkCollision: boolean) => {
          if (Math.abs(u) > 1 || Math.abs(v) > 1) return false;
          const hit = raycastDown(u * l.width * 0.5, v * l.depth * 0.5);
          if (!hit || hit.tierIndex !== d.tierIndex || hit.normal.y < 0.45) return false;
          if (checkCollision) {
            const cand = { ...d, u, v };
            if (findCollisions(working, cand).length) return false;
          }
          return true;
        };
        let found: { u: number; v: number } | null = null;
        const candidates: [number, number][] = [[d.u, d.v]];
        for (let ring = 1; ring <= 8; ring++) {
          const r = ring * 0.09;
          const n = 6 + ring * 3;
          for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            candidates.push([d.u + Math.cos(a) * r, d.v + Math.sin(a) * r]);
          }
        }
        // pull toward centre as a last resort
        for (let k = 1; k <= 10; k++) candidates.push([d.u * (1 - k / 10), d.v * (1 - k / 10)]);
        for (const pass of [true, false]) {
          for (const [u, v] of candidates) {
            if (valid(u, v, pass)) {
              found = { u, v };
              break;
            }
          }
          if (found) break;
        }
        const patch = found ? { ...found, pendingSnap: false } : { u: 0, v: 0, pendingSnap: false };
        patches.set(d.uid, patch);
        working.decorations = working.decorations.map((x) => (x.uid === d.uid ? { ...x, ...patch } : x));
      }
      if (patches.size)
        st.update((c) => {
          c.decorations = c.decorations.map((x) => (patches.has(x.uid) ? { ...x, ...patches.get(x.uid) } : x));
        }, { history: false });
    };
    raf = requestAnimationFrame(() => requestAnimationFrame(run));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, layouts, config.shape, config.shapeText]);
  return null;
}

/* ── Placement helpers ───────────────────────────────── */
function placeAt(decorationId: string, point: THREE.Vector3, normal: THREE.Vector3, tierIndex: number, layouts: TierLayout[]) {
  const st = useCakeStore.getState();
  const def = getDecoration(decorationId);
  if (!def) return false;
  if (def.placement === "scatter") {
    st.addDecoration(decorationId, { tierIndex, surface: "top", u: 0, v: 0 });
    return true;
  }
  let p = hitToPlacement(point, normal, tierIndex, layouts, st.config.shape);
  if (def.placement === "top" && p.surface === "side") {
    toast({ title: `${def.name} must sit on top`, description: def.heavy ? "Heavy decorations can't be attached to the side." : "Placed on the nearest top surface instead.", tone: "info" });
    p = { tierIndex, surface: "top", u: Math.cos(p.u) * 0.7, v: Math.sin(p.u) * 0.7 };
    st.addDecoration(decorationId, { ...p, pendingSnap: true });
    return true;
  }
  if (def.placement === "side" && p.surface === "top") {
    toast({ title: `${def.name} goes on the side`, tone: "info" });
    return false;
  }
  const cand = { uid: "_", decorationId, size: "M", scale: 1, rotation: 0, color: def.colors[0], ...p } as PlacedDecoration;
  const collide = findCollisions(st.config, cand).length > 0;
  const rotation = p.surface === "top" ? defaultRotation(decorationId, p.u, p.v) : 0;
  st.addDecoration(decorationId, { ...p, rotation, pendingSnap: collide && p.surface === "top" });
  if (collide) toast({ title: "Adjusted placement", description: "That spot was taken — nudged to the nearest free space.", tone: "info" });
  return true;
}

/* ── Drag to reposition ──────────────────────────────── */
function DragController({ layouts }: { layouts: TierLayout[] }) {
  const { camera, gl } = useThree();
  const controls = useThree((s) => s.controls) as unknown as { enabled: boolean } | null;
  const layoutsRef = useRef(layouts);
  layoutsRef.current = layouts;

  useEffect(() => {
    const el = gl.domElement;
    const ndc = new THREE.Vector2();
    const move = (e: PointerEvent) => {
      if (!dragState.uid) return;
      const rect = el.getBoundingClientRect();
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      const hit = raycastFromCamera(ndc, camera);
      if (!hit) return;
      const st = useCakeStore.getState();
      const d = st.config.decorations.find((x) => x.uid === dragState.uid);
      const def = d && getDecoration(d.decorationId);
      if (!d || !def) return;
      const p = hitToPlacement(hit.point, hit.normal, hit.tierIndex, layoutsRef.current, st.config.shape);
      if (def.placement === "top" && p.surface === "side") return;
      if (def.placement === "side" && p.surface === "top") return;
      dragState.moved = true;
      document.body.style.cursor = "grabbing";
      st.updateDecoration(d.uid, { ...p, pendingSnap: false }, { history: false });
    };
    const up = () => {
      if (!dragState.uid) return;
      const st = useCakeStore.getState();
      const d = st.config.decorations.find((x) => x.uid === dragState.uid);
      if (d && dragState.moved && findCollisions(st.config, d).length) {
        st.updateDecoration(d.uid, { pendingSnap: d.surface === "top" }, { history: false });
        toast({ title: "Too close to another decoration", description: "Moved to the nearest free spot.", tone: "info" });
      }
      st.endTransient();
      dragState.uid = null;
      setTimeout(() => (dragState.moved = false), 0);
      document.body.style.cursor = "";
      if (controls) controls.enabled = true;
    };
    el.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [camera, gl, controls]);
  return null;
}

/* ── Bridge for screenshots & HTML drag-and-drop ─────── */
function SceneBridge({ layouts }: { layouts: TierLayout[] }) {
  const { gl, scene, camera } = useThree();
  const layoutsRef = useRef(layouts);
  layoutsRef.current = layouts;
  useEffect(() => {
    sceneBridge.capture = () => {
      try {
        gl.render(scene, camera);
        const src = gl.domElement;
        const w = 520;
        const h = Math.round((src.height / src.width) * w);
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d")!;
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#2a1a14");
        g.addColorStop(1, "#120b08");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(src, 0, 0, w, h);
        return c.toDataURL("image/jpeg", 0.85);
      } catch {
        return null;
      }
    };
    sceneBridge.dropAt = (clientX, clientY, decorationId) => {
      const rect = gl.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      const hit = raycastFromCamera(ndc, camera);
      if (!hit) return false;
      return placeAt(decorationId, hit.point, hit.normal, hit.tierIndex, layoutsRef.current);
    };
    return () => {
      sceneBridge.capture = null;
      sceneBridge.dropAt = null;
    };
  }, [gl, scene, camera]);
  return null;
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#fff4ea", "#2a1a14", 0.5]} />
      <directionalLight
        castShadow
        position={[4, 7, 5]}
        intensity={2.3}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={5}
        shadow-camera-bottom={-3}
      />
      <spotLight position={[-5, 4, -4]} intensity={40} angle={0.7} penumbra={1} color="#f4c7c3" />
      <pointLight position={[0, 5, 3]} intensity={6} color="#fff1e0" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 5, -5]} scale={[10, 4, 1]} color="#fff3ea" />
        <Lightformer form="rect" intensity={2} position={[-5, 2, 1]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} color="#f4c7c3" />
        <Lightformer form="rect" intensity={2} position={[5, 2, 1]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} color="#ffe2c4" />
        <Lightformer form="ring" intensity={4} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={3} color="#ffffff" />
      </Environment>
    </>
  );
}

export { Lights };

export default function CakeScene({ className }: { className?: string }) {
  const config = useCakeStore((s) => s.config);
  const autoRotate = useCakeStore((s) => s.autoRotate);
  const [dpr, setDpr] = useState(1.75);
  const layouts = useMemo(
    () => computeTierLayout(config),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.shape, config.weightKg, config.tiers.length, config.tiers.map((t) => t.sizeScale).join(",")]
  );

  const onSurfaceClick = useCallback(
    (e: ThreeEvent<MouseEvent>, tierIndex: number) => {
      const st = useCakeStore.getState();
      if (dragState.moved) return;
      if (!st.armedDecoration) {
        st.select(null);
        return;
      }
      e.stopPropagation();
      if (!e.face) return;
      const normal = e.face.normal.clone().transformDirection(e.object.matrixWorld).normalize();
      placeAt(st.armedDecoration, e.point, normal, tierIndex, layouts);
      if (!e.shiftKey) st.arm(null);
    },
    [layouts]
  );

  return (
    <Canvas
      className={className}
      shadows
      dpr={[1, dpr]}
      camera={{ position: [3.6, 3.2, 4.6], fov: 34, near: 0.1, far: 100 }}
      gl={{ antialias: true, preserveDrawingBuffer: true, alpha: true, powerPreference: "high-performance" }}
      onPointerMissed={() => useCakeStore.getState().select(null)}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(2)} flipflops={3} onFallback={() => setDpr(1)} />
      <AdaptiveDpr pixelated={false} />
      <Lights />
      <CakeModel config={config} interactive onSurfaceClick={onSurfaceClick} />
      <ContactShadows position={[0, standBottom(config.extras.basePlate) - 0.001, 0]} opacity={0.55} scale={8} blur={2.6} far={4} resolution={512} color="#1a0d08" />
      <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.08} minDistance={2.2} maxDistance={14} maxPolarAngle={Math.PI * 0.53} autoRotate={autoRotate} autoRotateSpeed={1.4} />
      <CameraRig layouts={layouts} />
      <SnapResolver config={config} layouts={layouts} />
      <DragController layouts={layouts} />
      <SceneBridge layouts={layouts} />
    </Canvas>
  );
}
