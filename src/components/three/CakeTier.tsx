"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { ShapeId, TierConfig } from "@/types/cake";
import type { TierLayout } from "@/lib/cake/dimensions";
import { buildTierGeometry, getLoadedFont, loadCakeFont } from "./geometry";
import { colorize, makeFrostingMaterial, type ColorTargets } from "./CakeMaterial";
import { tierMeshes } from "./registry";
import { prefersReducedMotion } from "@/lib/utils";

interface Props {
  index: number;
  tier: TierConfig;
  layout: TierLayout;
  shape: ShapeId;
  shapeText: string;
  interactive?: boolean;
  assemble?: boolean;
  onSurfaceClick?: (e: ThreeEvent<MouseEvent>, tierIndex: number) => void;
}

/** CakeTier — one tier mesh with frosting material, colour transitions and assembly animation. */
export function CakeTier({ index, tier, layout, shape, shapeText, interactive, assemble = true, onSurfaceClick }: Props) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const needsFont = shape === "number" || shape === "letter";
  const [font, setFont] = useState(getLoadedFont());

  useEffect(() => {
    if (needsFont && !font) loadCakeFont().then(setFont).catch(() => {});
  }, [needsFont, font]);

  const geometry = useMemo(
    () => buildTierGeometry(shape, layout, shapeText, needsFont ? font : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shape, layout.width, layout.depth, layout.height, shapeText, font, needsFont]
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(() => makeFrostingMaterial(tier), [tier.frosting, tier.colorMode]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => material.dispose(), [material]);

  // colour transition state
  const current = useRef<ColorTargets>({ c1: new THREE.Color(tier.colors[0]), c2: new THREE.Color(tier.colors[1]) });
  const target = useMemo(() => ({ c1: new THREE.Color(tier.colors[0]), c2: new THREE.Color(tier.colors[1]) }), [tier.colors]);
  const dirty = useRef(true);

  useEffect(() => {
    colorize(geometry, tier, layout.height, current.current);
    dirty.current = true;
  }, [geometry, tier, layout.height]);

  useEffect(() => {
    material.sheenColor.copy(target.c1).lerp(new THREE.Color("#ffffff"), 0.5);
    dirty.current = true;
  }, [material, target]);

  // assembly animation: tiers descend into place
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const yAnim = useRef(assemble && !reduced ? layout.y + 2.2 + index * 0.6 : layout.y);
  const delay = useRef(assemble && !reduced ? index * 0.18 : 0);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    if (delay.current > 0) delay.current -= dt;
    else {
      const k = 1 - Math.exp(-dt * 7);
      yAnim.current += (layout.y - yAnim.current) * k;
      if (Math.abs(yAnim.current - layout.y) < 0.0005) yAnim.current = layout.y;
    }
    g.position.y = yAnim.current;

    if (dirty.current) {
      const k = reduced ? 1 : 1 - Math.exp(-dt * 8);
      current.current.c1.lerp(target.c1, k);
      current.current.c2.lerp(target.c2, k);
      colorize(geometry, tier, layout.height, current.current);
      const done = Math.abs(current.current.c1.r - target.c1.r) + Math.abs(current.current.c1.g - target.c1.g) + Math.abs(current.current.c1.b - target.c1.b) + Math.abs(current.current.c2.r - target.c2.r) + Math.abs(current.current.c2.g - target.c2.g) + Math.abs(current.current.c2.b - target.c2.b) < 0.002;
      if (done) {
        current.current.c1.copy(target.c1);
        current.current.c2.copy(target.c2);
        colorize(geometry, tier, layout.height, current.current);
        dirty.current = false;
      }
    }
  });

  useEffect(() => {
    const m = mesh.current;
    if (!interactive || !m) return;
    m.userData.tierIndex = index;
    tierMeshes.set(index, m);
    return () => {
      if (tierMeshes.get(index) === m) tierMeshes.delete(index);
    };
  }, [interactive, index, geometry]);

  return (
    <group ref={group} position={[0, yAnim.current, 0]}>
      <mesh
        ref={mesh}
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
        onClick={interactive && onSurfaceClick ? (e) => onSurfaceClick(e, index) : undefined}
      />
    </group>
  );
}
