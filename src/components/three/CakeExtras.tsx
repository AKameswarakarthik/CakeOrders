"use client";
/** Drip, borders and cake stand. Repeated elements use instanced meshes. */
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { BasePlate, BorderStyle, ShapeId } from "@/types/cake";
import type { TierLayout } from "@/lib/cake/dimensions";
import { outlineShape } from "./geometry";
import { tierPolygon } from "./placement";
import { getBumpTexture } from "./CakeMaterial";
import { prefersReducedMotion } from "@/lib/utils";

const dummy = new THREE.Object3D();

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/* ── Chocolate drip ───────────────────────────────────── */
export function Drip({ layout, shape, color }: { layout: TierLayout; shape: ShapeId; color: string }) {
  const inst = useRef<THREE.InstancedMesh>(null);
  const progress = useRef(prefersReducedMotion() ? 1 : 0);

  const capGeo = useMemo(() => {
    const s = outlineShape(shape === "multi-tier" ? "round" : shape, layout.width * 1.012, layout.depth * 1.012);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 3, curveSegments: 48 });
    g.rotateX(-Math.PI / 2);
    return g;
  }, [shape, layout.width, layout.depth]);
  useEffect(() => () => capGeo.dispose(), [capGeo]);

  const drips = useMemo(() => {
    const poly = tierPolygon(shape, layout);
    const perimeter = poly.reduce((s, p, i) => (i ? s + p.distanceTo(poly[i - 1]) : 0), 0);
    const n = Math.max(12, Math.floor(perimeter / 0.11));
    const rnd = seeded(Math.floor(layout.width * 1000) + n);
    const arr: { x: number; z: number; len: number }[] = [];
    for (let i = 0; i < n; i++) {
      const p = poly[Math.floor((i / n) * (poly.length - 1))];
      const q = poly[Math.min(poly.length - 1, Math.floor((i / n) * (poly.length - 1)) + 1)];
      const nrm = new THREE.Vector2(q.y - p.y, -(q.x - p.x)).normalize();
      if (nrm.dot(p) < 0) nrm.negate();
      const out = p.clone().add(nrm.multiplyScalar(0.006));
      arr.push({ x: out.x, z: out.y, len: (0.05 + rnd() * 0.32) * layout.height * (i % 3 === 0 ? 1.25 : 0.8) });
    }
    return arr;
  }, [shape, layout]);

  const capsule = useMemo(() => new THREE.CapsuleGeometry(0.026, 1, 4, 10), []);
  useEffect(() => () => capsule.dispose(), [capsule]);

  const write = (p: number) => {
    const m = inst.current;
    if (!m) return;
    drips.forEach((d, i) => {
      const len = Math.max(0.001, d.len * p);
      dummy.position.set(d.x, layout.height - len / 2, d.z);
      dummy.scale.set(1, len, 0.9);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  };
  useLayoutEffect(() => write(progress.current));
  useFrame((_, dt) => {
    if (progress.current >= 1) return;
    progress.current = Math.min(1, progress.current + dt * 0.7);
    write(1 - Math.pow(1 - progress.current, 3));
  });

  const mat = (
    <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={0.9} clearcoatRoughness={0.1} metalness={color === "#d4af37" ? 0.8 : 0.05} envMapIntensity={1.4} />
  );

  if (shape === "number" || shape === "letter" || shape === "dome") return null;
  return (
    <group position={[0, layout.y, 0]}>
      <mesh geometry={capGeo} position={[0, layout.height - 0.012, 0]} castShadow>
        {mat}
      </mesh>
      <instancedMesh ref={inst} args={[capsule, undefined, drips.length]} castShadow key={drips.length}>
        {mat}
      </instancedMesh>
    </group>
  );
}

/* ── Decorative borders ───────────────────────────────── */
export function Border({ layout, shape, style, color }: { layout: TierLayout; shape: ShapeId; style: BorderStyle; color: string }) {
  const inst = useRef<THREE.InstancedMesh>(null);
  const poly = useMemo(() => (shape === "number" || shape === "letter" ? [] : tierPolygon(shape === "dome" ? "round" : shape, layout)), [shape, layout]);
  const spacing = style === "pearl" ? 0.06 : style === "rosette" ? 0.1 : 0.07;
  const points = useMemo(() => {
    if (!poly.length) return [];
    const res: { x: number; z: number; a: number }[] = [];
    let acc = 0;
    for (let i = 1; i < poly.length; i++) {
      const a = poly[i - 1];
      const b = poly[i];
      const seg = a.distanceTo(b);
      let t = acc;
      while (t < seg) {
        const p = a.clone().lerp(b, t / seg);
        res.push({ x: p.x * 1.01, z: p.y * 1.01, a: Math.atan2(b.y - a.y, b.x - a.x) });
        t += spacing;
      }
      acc = t - seg;
    }
    return res;
  }, [poly, spacing]);

  const geo = useMemo(() => {
    switch (style) {
      case "pearl":
        return new THREE.SphereGeometry(0.03, 14, 10);
      case "shell": {
        const g = new THREE.SphereGeometry(0.04, 12, 10);
        g.scale(1.3, 0.75, 0.9);
        return g;
      }
      case "rosette":
        return new THREE.TorusKnotGeometry(0.03, 0.014, 40, 6, 2, 5);
      default:
        return null;
    }
  }, [style]);
  useEffect(() => () => geo?.dispose(), [geo]);

  const ropeGeo = useMemo(() => {
    if (style !== "rope" || poly.length < 3) return null;
    const pts = poly.map((p) => new THREE.Vector3(p.x * 1.012, 0.03, p.y * 1.012));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 220, 0.026, 8, true);
  }, [style, poly]);
  useEffect(() => () => ropeGeo?.dispose(), [ropeGeo]);

  useLayoutEffect(() => {
    const m = inst.current;
    if (!m) return;
    points.forEach((p, i) => {
      dummy.position.set(p.x, 0.028, p.z);
      dummy.rotation.set(0, -p.a, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [points, geo]);

  if (style === "none" || !poly.length) return null;
  const metal = color === "#d4af37" || color === "#c0c0c0";
  const material = <meshPhysicalMaterial color={color} roughness={style === "pearl" ? 0.15 : 0.6} metalness={metal ? 0.9 : style === "pearl" ? 0.3 : 0} clearcoat={style === "pearl" ? 1 : 0.1} sheen={0.3} />;
  return (
    <group position={[0, layout.y, 0]}>
      {ropeGeo ? (
        <mesh geometry={ropeGeo} castShadow>
          {material}
        </mesh>
      ) : (
        geo && (
          <instancedMesh ref={inst} args={[geo, undefined, points.length]} key={`${style}-${points.length}`} castShadow>
            {material}
          </instancedMesh>
        )
      )}
    </group>
  );
}

/* ── Cake stand / base plate ──────────────────────────── */
export function CakeStand({ plate, radius }: { plate: BasePlate; radius: number }) {
  const R = radius + 0.28;
  const woodBump = useMemo(() => getBumpTexture("fine"), []);
  if (plate === "marble" || plate === "glass") {
    const pedestal = (
      <>
        <mesh receiveShadow castShadow position={[0, -0.04, 0]}>
          <cylinderGeometry args={[R, R * 0.98, 0.08, 96]} />
          {plate === "glass" ? (
            <meshPhysicalMaterial color="#e8f6fb" roughness={0.05} transparent opacity={0.45} clearcoat={1} envMapIntensity={2} />
          ) : (
            <meshPhysicalMaterial color="#f2efea" roughness={0.18} clearcoat={0.8} bumpMap={woodBump ?? undefined} bumpScale={0.2} />
          )}
        </mesh>
        <mesh castShadow position={[0, -0.45, 0]}>
          <cylinderGeometry args={[0.18, 0.28, 0.74, 48]} />
          <meshPhysicalMaterial color={plate === "glass" ? "#d6eef6" : "#ebe6df"} roughness={0.1} transparent={plate === "glass"} opacity={plate === "glass" ? 0.5 : 1} clearcoat={1} />
        </mesh>
        <mesh receiveShadow castShadow position={[0, -0.84, 0]}>
          <cylinderGeometry args={[R * 0.55, R * 0.6, 0.06, 64]} />
          <meshPhysicalMaterial color={plate === "glass" ? "#d6eef6" : "#ebe6df"} roughness={0.12} transparent={plate === "glass"} opacity={plate === "glass" ? 0.5 : 1} clearcoat={1} />
        </mesh>
      </>
    );
    return <group>{pedestal}</group>;
  }
  if (plate === "wood") {
    return (
      <mesh receiveShadow castShadow position={[0, -0.08, 0]}>
        <cylinderGeometry args={[R, R, 0.16, 64]} />
        <meshStandardMaterial color="#8a5a3b" roughness={0.8} bumpMap={woodBump ?? undefined} bumpScale={2} />
      </mesh>
    );
  }
  const color = plate === "gold" ? "#d4af37" : "#c7ccd4";
  return (
    <group>
      <mesh receiveShadow position={[0, -0.02, 0]}>
        <cylinderGeometry args={[R, R, 0.04, 96]} />
        <meshPhysicalMaterial color={color} metalness={0.95} roughness={0.32} envMapIntensity={1.4} />
      </mesh>
      <mesh receiveShadow castShadow position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.22, 0.32, 0.42, 48]} />
        <meshPhysicalMaterial color={color} metalness={0.95} roughness={0.25} envMapIntensity={1.4} />
      </mesh>
      <mesh receiveShadow castShadow position={[0, -0.48, 0]}>
        <cylinderGeometry args={[R * 0.5, R * 0.55, 0.05, 64]} />
        <meshPhysicalMaterial color={color} metalness={0.95} roughness={0.25} envMapIntensity={1.4} />
      </mesh>
    </group>
  );
}

export const standBottom = (plate: BasePlate) => (plate === "marble" || plate === "glass" ? -0.87 : plate === "wood" ? -0.16 : -0.505);
