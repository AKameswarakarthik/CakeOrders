# CakeVerse — Development Plan & Progress

_Last updated: 2026-11-24_

Legend: ✅ done · 🟡 partial / simplified · ⏳ pending

## Phase 1 — Project, architecture, routing, design system, homepage ✅
- ✅ Next.js 15 App Router + TypeScript + Tailwind v4, folder architecture, path aliases
- ✅ Design system: CSS tokens, dark/light themes (no flash), glassmorphism, gradients, glow, buttons, chips, fields
- ✅ Fonts: Playfair Display, Manrope, Great Vibes, Cinzel, Fredoka, Noto Sans Devanagari & Telugu
- ✅ Navbar (responsive, animated active pill, cart badge), footer, toasts, confirm dialog, skip link, 404 & error pages
- ✅ Homepage: 3D hero with floating decor, falling sprinkles, sparkles, scroll-driven transform; occasions, trending, build-your-own (assembling layers), flavour combos, reviews marquee, how-it-works, delivery info, CTA

## Phase 2 — 3D scene, geometry, materials, lighting, camera ✅
- ✅ Procedural geometry: round, square, rectangle, heart, hexagon, oval (extrude + bevel), dome (lathe), number/letter (TextGeometry), multi-tier
- ✅ Separate mesh per tier, PBR frosting presets (10 finishes), procedural bump textures, vertex-colour gradients
- ✅ Ambient/hemisphere/directional (shadows)/rim lights, Lightformer environment reflections (no network), contact shadows
- ✅ Cake stands: gold, silver, marble, wood, glass
- ✅ OrbitControls + camera presets with smooth transitions, auto-rotate
- ✅ Tier assembly animation, smooth colour transitions

## Phase 3 — Shape, weight, flavour, frosting, colours, tiers ✅
- ✅ 10 shapes incl. number/letter text, weight presets + custom (0.5–20 kg) with servings, eggless
- ✅ 1–5 tiers with per-tier size, flavour, frosting, colours (tier scope selector)
- ✅ 15 flavours, 10 frostings, colour modes: solid, two-tone, ombré, rainbow, metallic gold/silver
- ✅ Palettes, custom picker, HEX input, recently-used colours, AI colour harmonies

## Phase 4 — Decoration library & placement ✅
- ✅ 60+ decorations across 6 categories with thumbnails, price, quantity, colours, sizes, edible/non-edible badges
- ✅ Search, category & occasion filters, favourites
- ✅ ~40 procedural 3D models (roses bloom, candles flicker, butterflies flap, sprinkles fall)
- ✅ HTML drag-and-drop onto the canvas, click-to-place, auto-place
- ✅ Raycast surface-aware placement on tops & sides, drag-to-reposition, collision avoidance, top-only rules for heavy items
- ✅ Inspector: scale, rotate, size, colour, tier, label, duplicate, delete; keyboard shortcuts
- ✅ GLB/GLTF support with procedural fallback (`modelUrl`)
- ✅ Instanced meshes for sprinkles/confetti/glitter, drips, borders

## Phase 5 — Message, photo, history, saving ✅
- ✅ Message: font, colour, size, curved/straight, top/front/side/plaque, chocolate/fondant/icing lettering; English, Hindi, Telugu (auto font)
- ✅ Photo cake: upload (compressed), drag-to-crop, zoom, circle/rect, size & position on cake
- ✅ Extras: drip styles, fillings, extra cream, coating, borders, base plate, packaging, gift message, instructions
- ✅ Undo/redo (60 steps, drags = single step), auto-saved draft, reset, screenshot, save design, share link

## Phase 6 — Pricing, cart, checkout, confirmation ✅
- ✅ Config-driven PricingEngine (base, weight, flavour/frosting per kg, tiers, colour finishes, decorations × size, message, photo, extras, packaging, delivery, GST, coupons)
- ✅ Live animated price with transparent breakdown + warnings
- ✅ Review page, cart (multiple cakes, qty, edit, duplicate, remove, coupons, share)
- ✅ Checkout with RHF + Zod, PIN serviceability, date/slot, midnight/express/pickup, gift recipient, mock payments (no credentials collected)
- ✅ Animated confirmation with confetti & mock order ID, simulated order tracking, profile & order history

## Phase 7 — AI-assisted designer ✅
- ✅ `AIDesignService` interface + rule-based parser (occasion, tiers, shape, number/letter, weight, flavour, frosting, colours, colour modes, eggless, decorations with colours & quantities, message)
- ✅ Surprise Me, Recommend Decorations, Optimize My Budget, Suggest Matching Colours, Alternative Designs
- ✅ Open generated design in the studio

## Phase 8 — Responsiveness, a11y, performance, tests 🟡
- ✅ Mobile studio: compact sticky preview + expandable bottom sheet; single canvas per layout
- ✅ Keyboard support, ARIA roles/labels, focus styles, reduced-motion support, skip link
- ✅ Lazy-loaded 3D, adaptive DPR, resource disposal, instancing
- ✅ WebGL fallback 2D preview
- ✅ Vitest unit tests (15) for pricing, parser, budget optimiser, validation, layout, catalog integrity, share links
- ✅ Production build passes (type-check + lint)
- ⏳ E2E tests (Playwright) for studio drag/drop & checkout
- ⏳ Real GLB assets for figurines (pipeline documented in README)
- ⏳ Image cropping with rotation; per-decoration multi-colour

## Known limitations / next steps
- Drips and borders are skipped on number/letter shapes (outline is glyph-based); message moves to a plaque for those shapes.
- Side messages on non-round shapes are flat decals on the front face.
- Status tracking is simulated (advances every 2 minutes).
- Saved designs / cart live in LocalStorage (per browser). A backend should replace `orderService` and persistence.
- AI parser is rule-based; swap `aiDesignService` for an LLM-backed implementation for open-ended prompts.
