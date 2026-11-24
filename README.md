# CakeVerse — 3D Cake Design Studio

A premium, futuristic cake-ordering web app where customers design a celebration cake from scratch in **real-time 3D**, see a live price breakdown, and place a (mock) order.

Built with **Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Three.js · React Three Fiber · Drei · Framer Motion · Zustand · React Hook Form + Zod · Lucide**.

> This is a complete frontend prototype. Data is mock/local (LocalStorage) behind a small service layer, so a real backend can be plugged in later. **No real payments are processed and no payment details are collected.**

---

## Quick start

```bash
cd CakeOrders
npm install
npm run dev          # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build (type-checks + lints) |
| `npm start` | Serve the production build |
| `npm test` | Unit tests (Vitest) — pricing, AI parser, validation, sharing, catalog integrity |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

Requirements: Node 18.18+ (tested on Node 24). Fonts are loaded from Google Fonts at runtime.

---

## Deploying to GitHub Pages

The app is configured as a **fully static export** (`output: "export"` in `next.config.ts`) — `npm run build` writes a ready-to-host site to `out/` (an `index.html` per page plus `_next/` assets, ~4 MB). No server is needed.

**Option A — automatic (recommended)**

1. Push this folder to a GitHub repository (branch `main`).
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push runs `.github/workflows/deploy-pages.yml`, which builds and publishes the site. It sets the base path automatically:
   - repo `CakeOrders` → `https://<user>.github.io/CakeOrders/`
   - repo `<user>.github.io` → `https://<user>.github.io/`

**Option B — manual upload**

```bash
NEXT_PUBLIC_BASE_PATH=/<your-repo-name> npm run build
```

Then publish the contents of `out/` (e.g. to a `gh-pages` branch). Leave `NEXT_PUBLIC_BASE_PATH` empty when hosting at a domain root. `public/.nojekyll` is included so GitHub serves the `_next/` folder.

> Since Pages is static, cart, saved designs and orders live in each visitor's browser (LocalStorage), exactly as in the prototype.

## Feature tour

| Page | Route | Highlights |
| --- | --- | --- |
| Home | `/` | Rotating 3D hero cake with floating roses/stars/strawberries, falling instanced sprinkles, sparkles, scroll-driven cake transform; occasions, trending, flavour pairings, reviews, how-it-works, delivery info |
| Collections | `/collections` | 11 signature templates, filter by occasion, open any in the studio |
| **Design Studio** | `/studio` | Split-screen: 11-step controls + sticky live 3D preview (mobile: compact preview + bottom sheet) |
| Review | `/review` | Cinematic rotating preview, captured thumbnail, full spec, warnings, price breakdown, save / duplicate / share / add to cart |
| AI Designer | `/ai-designer` | Natural-language → cake config; Surprise Me, Recommend Decorations, Optimize Budget, Matching Colours, Alternative Designs |
| Saved designs | `/saved` | LocalStorage designs with thumbnails; edit, duplicate, share, delete |
| Cart | `/cart` | Multiple custom cakes, quantities, edit (re-opens studio), duplicate, coupons |
| Checkout | `/checkout` | RHF + Zod validation, PIN serviceability, date & slots, midnight/express/pickup, gift recipient, mock payment methods |
| Confirmation | `/order-confirmation?id=` | Confetti, mock order ID, summary |
| Tracking | `/track` | Simulated status timeline |
| Profile, About, Contact, FAQ | `/profile` `/about` `/contact` `/faq` | Saved profile pre-fills checkout, order history, theme |

Studio steps: **Occasion → Shape → Size → Tiers → Flavour → Frosting → Colours → Decorations → Message → Photo → Extras**.

Studio interactions:
- Orbit / zoom, front · side · top · ¾ camera presets with smooth transitions, auto-rotate
- Add decorations by **drag-and-drop from the library**, **click-to-place** (crosshair; Shift-click to place several) or **+** (auto-placed)
- Click a decoration to select → **drag it across the top or sides** (surface-aware), resize, rotate, recolour, change size, move tier, duplicate, delete
- Keyboard: `Ctrl/⌘+Z` undo, `Ctrl/⌘+Shift+Z` / `Ctrl+Y` redo, `Delete` remove, `[` `]` rotate, `+` `-` scale, arrows nudge, `Esc` deselect
- Undo/redo history (60 steps), auto-saved draft, screenshot download, save design, share link
- Per-tier flavour / frosting / colours via the "Apply to" tier scope
- Validation & **bakery-approval** flags (tier/weight structure, heavy figurines on soft frosting, overcrowding, custom flavour/figurine, >10 kg)
- WebGL detection → **2D SVG fallback preview**

---

## Architecture

```
src/
├─ app/                         # Next.js routes (one folder per page)
├─ types/cake.ts                # Serializable CakeConfig + catalog types
├─ data/                        # Mock catalog — edit these, not components
│  ├─ catalog.ts                # shapes, weights, flavours, frostings, palettes, fillings, plates…
│  ├─ decorations.ts            # 60+ decorations (price, edible, colours, sizes, placement, model)
│  ├─ occasions.ts              # occasions + recommended shapes/colours/decorations
│  ├─ pricing.ts                # ALL prices, coupons, GST, delivery fees, slots
│  ├─ templates.ts              # signature cake templates (builders)
│  └─ content.ts                # reviews, FAQs, flavour combos
├─ lib/
│  ├─ cake/
│  │  ├─ defaults.ts            # config factories, ring placement helpers, default rotations
│  │  ├─ dimensions.ts          # pure tier layout (sizes/heights from weight & tiers)
│  │  └─ validation.ts          # design warnings, approval rules, collision checks
│  ├─ pricing/PricingEngine.ts  # cake lines, coupons, delivery, GST, order totals
│  ├─ ai/AIDesignService.ts     # AIDesignService interface + rule-based implementation
│  └─ services/                 # orderService (mock API), share-link encoding
├─ store/
│  ├─ cakeStore.ts              # CakeConfigurationStore + DesignHistory (undo/redo, transient drags, auto-save)
│  └─ appStore.ts               # cart, saved designs, orders, prefs (persisted) · toasts & confirm dialog
├─ components/
│  ├─ three/                    # 3D layer (only loaded on demand)
│  │  ├─ CakeScene.tsx          # studio canvas: lights, env, CameraControls/rig, SnapResolver, DragController, bridge
│  │  ├─ CakeModel.tsx          # CakeGeometry composition: tiers, drips, borders, message, photo, decorations, stand
│  │  ├─ CakeTier.tsx           # one tier mesh + assembly animation + colour transitions
│  │  ├─ geometry.ts            # procedural geometry for every shape (extrude, lathe, TextGeometry)
│  │  ├─ CakeMaterial.ts        # PBR frosting presets, procedural bump textures, vertex colouring
│  │  ├─ CakeExtras.tsx         # instanced drips & borders, cake stands
│  │  ├─ CakeDecals.tsx         # message (canvas texture, curved/straight, EN/HI/TE) & edible photo
│  │  ├─ DecorationLayer.tsx    # DecorationMesh, GLB loader + fallback, instanced scatter (sprinkles…)
│  │  ├─ DecorationModels.tsx   # ~40 procedural decoration models
│  │  ├─ placement.ts           # DecorationPlacement: (u,v) ↔ world transforms, hit → placement
│  │  ├─ registry.ts            # tier-mesh registry + raycasting helpers
│  │  └─ CakeShowcase.tsx       # non-interactive cinematic canvas (hero, review, AI)
│  ├─ builder/                  # CakeBuilder, step panels (Shape/Size/Tier/Flavor/Frosting/ColorPicker/
│  │                            # DecorationLibrary/MessageEditor/PhotoUploader/Extras), PreviewPanel,
│  │                            # DecorationInspector, PriceSummary, Fallback2D, actions
│  ├─ cart/CakeSummary.tsx      # specs & thumbnails reused by review/cart/confirmation
│  ├─ home/                     # hero + homepage sections
│  └─ layout/                   # navbar, footer, toaster, confirm dialog, providers
└─ __tests__/core.test.ts
```

### Data flow

1. **`CakeConfig`** (in `types/cake.ts`) is the single, JSON-serializable source of truth: shape, weight, tiers (flavour/frosting/colours each), decorations with positions/rotations/scales, message, photo, extras.
2. UI steps mutate it through **`useCakeStore.update()`**, which records history. Drags use `beginTransient()`/`endTransient()` so one drag = one undo step.
3. The 3D scene subscribes to the config and renders it; **business logic never lives in components** — prices come from `PricingEngine`, rules from `validation.ts`, layout from `dimensions.ts`.
4. Cart, saved designs, orders and prefs persist via Zustand `persist` → LocalStorage. The working draft auto-saves separately.

### Resolution-independent decoration placement

Decorations store `(surface, tierIndex, u, v)` rather than world coordinates:
- **top** → `u, v ∈ [-1, 1]` across the tier footprint;
- **side** → `u` = angle around the tier, `v` = height fraction.

So changing weight, tiers or shape keeps decorations attached. When geometry changes, top decorations are flagged `pendingSnap` and the **SnapResolver** ray-casts down onto the real tier meshes to keep them on the surface, on the right tier and clear of collisions (spiral search). Drops, clicks and drags all ray-cast against registered tier meshes (`registry.ts`).

### Performance

- 3D code is split out with `next/dynamic` (`ssr: false`) — pages load with ~100–190 kB JS and the studio canvas streams in.
- Only **one WebGL canvas** is mounted per layout (desktop vs mobile chosen by media query).
- Sprinkles, confetti, glitter, drips and borders use **InstancedMesh**.
- Geometries/materials/textures are memoised and **disposed** on change/unmount; procedural textures are generated once and shared.
- `PerformanceMonitor` + `AdaptiveDpr` adapt pixel ratio; colour transitions recompute vertex colours only while animating.
- `prefers-reduced-motion` disables assembly/bloom/falling animations (and CSS animations).

---

## Adding new 3D models (GLB / GLTF)

Every decoration has a procedural model so the app works with zero assets. To use a real model:

1. Export your model as **`.glb`** (preferred) with:
   - **Y-up**, base sitting at **y = 0**, centred on X/Z;
   - real-world scale where the cake radius ≈ **1 unit** (a rose ≈ 0.12 units across);
   - Draco/meshopt compression and ≤ 1k–5k triangles for decorations; textures ≤ 1024² (KTX2/WebP).
2. Put it in `public/models/`, e.g. `public/models/bride-groom.glb`.
3. Set `modelUrl` on the decoration in `src/data/decorations.ts`:

   ```ts
   d({ id: "bride-groom", ..., model: "bride-groom", modelUrl: "/models/bride-groom.glb" })
   ```

4. That's it — `DecorationLayer` loads it with `useGLTF`, tints materials to the chosen colour (set `userData.tintable = false` on meshes that must keep their colour), and falls back to the procedural model while loading or if the file fails.

To add a brand-new decoration type: add a `DecorationModel` id in `types/cake.ts`, a procedural component in `DecorationModels.tsx` (register it in `MODEL_COMPONENTS`), then a catalog entry in `data/decorations.ts`. Prices, library, AI keywords (`DECO_KEYWORDS` in `AIDesignService.ts`) and occasions pick it up from data.

## Connecting a backend

- **Pricing**: replace values in `data/pricing.ts` with a fetched config (the engine is pure).
- **Orders / PIN check / tracking**: implement `lib/services/orderService.ts` against your API.
- **AI**: implement the `AIDesignService` interface (e.g. call an LLM that returns a `CakeConfig` JSON) and swap the exported `aiDesignService`.
- **Payments**: integrate a gateway SDK on the server; the checkout page only passes the selected method.

## Coupons (mock)

`SWEET10` (10% up to ₹300) · `FIRSTCAKE` (₹150 off ≥ ₹999) · `LOVE20` (20% ≥ ₹2,499, up to ₹600) · `MIDNIGHT` (free midnight delivery). Serviceable PIN prefixes: `50 40 11 56 60 70 52 53`.
