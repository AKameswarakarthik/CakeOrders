/**
 * Core, fully-serializable cake configuration types.
 * Everything the 3D scene, pricing engine and checkout need lives in CakeConfig.
 */

export type OccasionId =
  | "birthday"
  | "anniversary"
  | "engagement"
  | "wedding"
  | "baby-shower"
  | "valentine"
  | "graduation"
  | "congratulations"
  | "corporate"
  | "custom";

export type ShapeId =
  | "round"
  | "square"
  | "rectangle"
  | "heart"
  | "hexagon"
  | "oval"
  | "number"
  | "letter"
  | "dome"
  | "multi-tier";

export type FlavorId =
  | "chocolate"
  | "vanilla"
  | "black-forest"
  | "white-forest"
  | "red-velvet"
  | "butterscotch"
  | "strawberry"
  | "pineapple"
  | "blueberry"
  | "belgian-chocolate"
  | "chocolate-truffle"
  | "coffee"
  | "rasmalai"
  | "kitkat"
  | "custom";

export type FrostingId =
  | "buttercream"
  | "whipped-cream"
  | "ganache"
  | "fondant"
  | "cream-cheese"
  | "mirror-glaze"
  | "naked"
  | "semi-naked"
  | "velvet"
  | "chocolate-drip";

export type ColorMode = "solid" | "two-tone" | "ombre" | "rainbow" | "gold" | "silver";

export type DecorationCategory =
  | "chocolate"
  | "figurine"
  | "flower"
  | "luxury"
  | "fruit"
  | "celebration";

export type DecorationSize = "S" | "M" | "L";

export type Surface = "top" | "side";

export interface TierConfig {
  id: string;
  /** 0.7 – 1.15 multiplier on the automatic tier footprint */
  sizeScale: number;
  flavor: FlavorId;
  frosting: FrostingId;
  colorMode: ColorMode;
  /** primary / secondary color (secondary used for two-tone & ombre) */
  colors: [string, string];
}

export interface PlacedDecoration {
  uid: string;
  decorationId: string;
  tierIndex: number;
  surface: Surface;
  /**
   * Resolution-independent placement:
   *  top  → u,v = normalized x,z in [-1, 1] across the tier footprint
   *  side → u = angle around the tier (radians), v = height fraction 0..1
   */
  u: number;
  v: number;
  /** rotation around the surface normal, radians */
  rotation: number;
  scale: number;
  color: string;
  size: DecorationSize;
  /** custom text for toppers / letters / number candles */
  label?: string;
  /** set when the scene should re-validate/snap this decoration onto the surface */
  pendingSnap?: boolean;
}

export type MessageFont = "script" | "elegant" | "modern" | "playful" | "devanagari" | "telugu";
export type MessageMaterial = "chocolate" | "fondant" | "icing";
export type MessagePosition = "top-center" | "top-front" | "side-front" | "plaque";

export interface CakeMessage {
  text: string;
  font: MessageFont;
  color: string;
  size: number; // 0.5 – 1.5
  curved: boolean;
  position: MessagePosition;
  material: MessageMaterial;
}

export interface PhotoConfig {
  dataUrl: string | null;
  shape: "circle" | "rect";
  /** size on cake relative to tier top (0.3 – 0.9) */
  scale: number;
  /** crop zoom inside the image (1 – 3) */
  zoom: number;
  /** crop offsets (-1 .. 1) */
  offsetX: number;
  offsetY: number;
  /** placement offset on the cake top (-0.5 .. 0.5) */
  posX: number;
  posY: number;
}

export type DripStyle = "none" | "dark" | "white" | "gold" | "caramel" | "pink";
export type BorderStyle = "none" | "pearl" | "shell" | "rosette" | "rope";
export type BasePlate = "gold" | "silver" | "marble" | "wood" | "glass";
export type Packaging = "standard" | "premium" | "luxury";

export interface CakeExtras {
  dripStyle: DripStyle;
  filling: string;
  extraCream: boolean;
  chocolateCoating: boolean;
  border: BorderStyle;
  borderColor: string;
  basePlate: BasePlate;
  packaging: Packaging;
  giftMessage: string;
  specialInstructions: string;
}

export interface CakeConfig {
  id: string;
  name: string;
  occasion: OccasionId;
  customOccasion?: string;
  shape: ShapeId;
  /** text used for number / letter shaped cakes */
  shapeText: string;
  weightKg: number;
  eggless: boolean;
  customFlavorNote?: string;
  tiers: TierConfig[];
  decorations: PlacedDecoration[];
  message: CakeMessage;
  photo: PhotoConfig;
  extras: CakeExtras;
  thumbnail?: string;
  templateId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DecorationDef {
  id: string;
  name: string;
  category: DecorationCategory;
  /** procedural model kind used by DecorationMesh */
  model: DecorationModel;
  price: number;
  edible: boolean;
  emoji: string;
  colors: string[];
  sizes: DecorationSize[];
  placement: "top" | "side" | "any" | "scatter";
  /** collision radius in world units at size M, scale 1 */
  radius: number;
  occasions: OccasionId[];
  maxQty: number;
  description: string;
  defaultLabel?: string;
  /** heavy / structural items need firm frosting */
  heavy?: boolean;
  requiresApproval?: boolean;
  /** optional GLB / GLTF model; procedural model is used as fallback */
  modelUrl?: string;
  tags?: string[];
}

export type DecorationModel =
  | "rose"
  | "star"
  | "heart"
  | "couple"
  | "bride-groom"
  | "dancing-couple"
  | "person"
  | "teddy"
  | "butterfly"
  | "ball"
  | "leaf"
  | "ribbon"
  | "letter"
  | "crown"
  | "bar"
  | "shard"
  | "flower"
  | "sunflower"
  | "orchid"
  | "lotus"
  | "gold-leaf"
  | "pearls"
  | "diamond"
  | "strawberry"
  | "blueberry"
  | "cherry"
  | "raspberry"
  | "mango"
  | "mixed-fruit"
  | "candle"
  | "number-candle"
  | "topper"
  | "ring"
  | "balloon"
  | "bell"
  | "rainbow"
  | "sprinkles"
  | "confetti"
  | "glitter"
  | "plaque"
  | "custom-figurine";

export interface PriceLine {
  label: string;
  amount: number;
  detail?: string;
}

export interface PriceBreakdown {
  lines: PriceLine[];
  subtotal: number;
  delivery: number;
  discount: number;
  discountLabel?: string;
  tax: number;
  total: number;
}

export interface DesignWarning {
  level: "info" | "approval" | "error";
  message: string;
}
