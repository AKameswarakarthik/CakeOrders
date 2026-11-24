"use client";
import { useMemo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { CakeConfig } from "@/types/cake";
import { computeTierLayout } from "@/lib/cake/dimensions";
import { DRIP_COLORS } from "@/data/catalog";
import { CakeTier } from "./CakeTier";
import { Border, CakeStand, Drip } from "./CakeExtras";
import { MessageMesh, PhotoMesh } from "./CakeDecals";
import { DecorationLayer } from "./DecorationLayer";

interface Props {
  config: CakeConfig;
  interactive?: boolean;
  showStand?: boolean;
  assemble?: boolean;
  onSurfaceClick?: (e: ThreeEvent<MouseEvent>, tierIndex: number) => void;
}

/** CakeBuilder's 3D output: tiers + drips + borders + message + photo + decorations. */
export function CakeModel({ config, interactive = false, showStand = true, assemble = true, onSurfaceClick }: Props) {
  const layouts = useMemo(
    () => computeTierLayout(config),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.shape, config.weightKg, config.tiers.length, config.tiers.map((t) => t.sizeScale).join(",")]
  );
  const top = layouts.length - 1;
  const dripColor = DRIP_COLORS[config.extras.dripStyle];

  return (
    <group>
      {config.tiers.map((t, i) => (
        <CakeTier
          key={t.id + ":" + i}
          index={i}
          tier={t}
          layout={layouts[i]}
          shape={config.shape}
          shapeText={config.shapeText}
          interactive={interactive}
          assemble={assemble}
          onSurfaceClick={onSurfaceClick}
        />
      ))}
      {config.tiers.map((t, i) =>
        t.frosting === "chocolate-drip" || (i === top && config.extras.dripStyle !== "none") ? (
          <Drip key={`drip-${i}`} layout={layouts[i]} shape={config.shape} color={i === top && dripColor ? dripColor : DRIP_COLORS.dark} />
        ) : null
      )}
      {config.extras.border !== "none" &&
        layouts.map((l, i) => <Border key={`border-${i}`} layout={l} shape={config.shape} style={config.extras.border} color={config.extras.borderColor} />)}
      <MessageMesh config={config} layouts={layouts} />
      <PhotoMesh config={config} layouts={layouts} />
      <DecorationLayer config={config} layouts={layouts} interactive={interactive} />
      {showStand && <CakeStand plate={config.extras.basePlate} radius={Math.max(layouts[0].width, layouts[0].depth) / 2} />}
    </group>
  );
}
