# STAMPED SVG home refactor

## Entry point and runnable source

`app/explore/page.tsx` renders `features/explore-map.tsx`. The welcome route remains `/`; the main map/home route is `/explore`.

Run `pnpm install --frozen-lockfile` then `pnpm dev`. No API keys or image service are required by the home map. The new home deliberately uses SVG rather than Mapbox or the old `reference-map.png`; existing dependencies and legacy assets are preserved for other work.

## Four isolated layers

1. **Base — `PaperBase` in `components/map/layers.tsx`.** A 128-unit repeating SVG pattern uses stitched `feTurbulence`, desaturation, low alpha, and isolated multiply blending. It is procedural at the renderer's resolution, with no raster image payload. Noise stays stationary and outside the moving plane.
2. **Landmass — `LandmassLayer`.** Five independently requested JSON segments in `public/map-regions/` supply authored SVG paths. Solid cyan-adjacent blue, pink, yellow, orange, green and violet fills follow the supplied illustrated direction. Stroke width is a Motion-derived `2 / scale`, inherited by land paths. This compensates for the outer CSS transform instead of incorrectly assuming `non-scaling-stroke` covers all ancestor CSS scaling. Outlines remain 2 screen CSS pixels; SVG's centered stroke is intentional.
3. **Accents — `AccentLayer`.** Separate transparent vector paths provide waves, dotted routes, an airplane, islands and ink stars. `pointer-events: none` keeps gestures unobstructed. These are original, stylized graphics, not navigation geography.
4. **Interactive — `LocationBadge` and `BadgeArt`.** Six accessible HTML buttons contain actual SVG landmark paths and count circles. Their positions are derived from camera coordinates; the glyphs stay at screen size rather than scaling with the landmass. There are no embedded bitmap wrappers, invisible raster hotspots, or bitmap landmark icons.

`LandmarkArt` contains separate path groups for the Statue of Liberty, Eiffel Tower, Tokyo pagoda, pyramids, Christ the Redeemer and Sydney Opera House. Inline comments identify the layers and compositing rationale.

## Motion and transition hooks

- **`useMapCamera`**: owns `useSpring` values for x, y, and scale. Pointer movement uses `jump()` for immediate tracking; release uses spring targets at rigid bounds. Trackpad scrolling pans directly (Shift + wheel pans sideways). Trackpad pinch, Ctrl/Meta + wheel and button zoom are spring-driven; two-pointer pinch preserves its focal canvas point.
- **`useTransform`**: derives exact land stroke compensation, screen-space badge positions and continuous center emphasis (1.00 → 1.05). These updates do not require React renders per frame.
- **`useReducedMotion`** and **`MotionConfig reducedMotion="user"`**: skip recoil, shared-layout movement, stagger delays and pulsing skeletons when requested by the OS. Immediate pressed feedback remains accessible without continuous animation.
- **`LayoutGroup` + matching `layoutId`**: `landmark-${location.id}` connects the map's SVG badge to the same vector element in the sheet header. Both elements use the same `BadgeArt` component; the source remains measurable during the handoff.
- **`AnimatePresence`**: retains the sheet until its spring exit completes, then restores focus to the originating badge.
- **`useSheetFocus`**: focuses the close control, traps Tab/Shift+Tab, handles Escape and locks document scrolling. The rest of the app is inert while the modal is open.
- **Motion variants**: spring slide-up/down and 55ms staggered content reveals. A separate backdrop opacity transition reveals `backdrop-filter: blur(7px)`; blur is not applied to the moving map itself.
- **`whileTap` / scoped CSS spring**: immediate 0.975 pressed scale (−2.5%) for controls, links and cards. No linear return tween.

Spring constants are shared: stiffness 340, damping 31, mass 0.8. Elastic overdrag is capped below 28 CSS pixels before recoil. `physics.ts` isolates the deterministic bounds/zoom math for testing. Opening, resetting and resizing center the world at 115% of the viewport-cover scale. The minimum zoom covers the viewport, so the atlas stays oversized and users pan to discover the other regions.

## Loading, error and performance behavior

`useRegions` fetches all five small segments independently after mount with abort cleanup. Every segment has a reserved, paper-colored dashed sketch path; success fades in without changing layout or pin anchors. Failures retain the skeleton and expose a retry control. Region nodes are memoized. Labels and keyboard-accessible pins remain usable even if a geography request fails.

Only the world plane and marker anchors receive transform compositing hints. The plane uses `translate3d`, explicit transform origin and `will-change: transform`. Grain does not animate. The venue image reserves its dimensions and uses async decode. This reduces avoidable layout work; actual GPU promotion, edge antialiasing and frame rate remain browser/device-dependent and are not claimed as measured results.

## Typography

Home and sheets use one locally bundled **Roboto Condensed variable font (100–900)**. Header weight 900, venue headings 850, labels 650–750 and body weight 400 are chosen within that family. The base type scale uses a 1.25 ratio, with fluid clamp headings, explicit line heights, wrapping metadata, responsive grid links and a scrollable, height-bounded sheet. Font licensing is bundled in `public/stamped-variable-OFL.txt`.

## Product behavior

All six badges open a sheet. Tokyo includes categories, Akihabara, Add to Plan, full experience details and the Tokyo collection link. Other cities honestly identify themselves as illustrated previews and link to the available Tokyo collection. Counts are demo content. Saving uses the existing repository adapter, including duplicate prevention, persistence and error reporting.

## Validation

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

Physics tests cover small-world centering, all rigid edges, bounded elastic overdrag and pinch focal-point preservation. Existing repository tests cover save/reload, duplicates, removal, malformed storage, invalid experiences, storage failures and onboarding. Route/segment HTTP smoke checks complement compilation. Real touch-device behavior, shared-element appearance and measured frame rate have not been browser/device-tested in this turn.

Motion APIs: https://motion.dev/docs/react-use-spring and https://motion.dev/docs/react-layout-animations

## Accurate collage geography revision

The five map segments now derive from Natural Earth 110m land polygons, using the same plate-carree projection for coastlines and real city longitude/latitude coordinates. Antarctica and larger islands are included. Colored print panels are clipped without relocating geography. A few nearby badge illustrations use screen-space offsets and dotted leader lines to preserve readable markers while their dots remain at the actual locations.

The collage appearance comes from a torn cyan print board, paper underlay, translucent tape, restrained halftone/fibre patterns, and ocean postmarks. No raster imagery is used. Regenerate segments with `python3 scripts/build-collage-geography.py /path/to/ne_110m_land.geojson`. Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson (Natural Earth, public domain). This is a travel discovery illustration rather than a navigation or political-boundary map.
