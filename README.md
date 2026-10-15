# STAMPED — Milestones 1–3

Mobile-first travel discovery, day planning, completion stamps and private scrapbook memories. The approved SVG collage map, artwork and stamp animations are preserved.

## Run

Requires Node.js 22.18+ and pnpm 11.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev --port 3001
```

Open http://localhost:3001. The default **local** mode needs no credentials and retains the browser prototype. To enable accounts and cloud persistence follow [Supabase setup](docs/supabase-setup.md). Public environment variables require a restart/rebuild.

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Build exports `out/`; serve with clean `.html` URL resolution. `next start` does not serve this static export. The dev server binds to all interfaces; phone testing needs a reachable Mac network address (localhost on a phone means the phone). Auth redirects must match that origin. Production should use HTTPS.

## Current functionality

- Welcome and three-step onboarding: home, interests and travel intentions.
- Oversized geographic SVG collage map with pan, zoom and animated badges; Tokyo discovery and category filters.
- Four Tokyo experiences plus a London South Bank seed available in the plan picker.
- Saved shortlist, up to 30 days, reorder/move/remove stops and persistent plans.
- Idempotent completion, physical stamp animation, optional 1–5 photo evidence, cover selection, rating, spending, duration and tips.
- Passport totals from actual completions, grouped by city; memory albums and editing.
- In cloud mode: email/password signup, login, logout, recovery, persistent sessions, private account data and private Storage photos.
- Explicit local backup and optional import from My Account; local originals are retained.

Create and Community remain future-milestone placeholders. Public map counts and community tips are illustrative seed content. Personal Passport counts are real completed records, not demo totals. Itinerary tables are prepared but no itinerary publishing UI is implemented.

## Routes and architecture

Routes: `/`, `/onboarding`, `/explore`, `/city/tokyo`, `/experience/[slug]`, `/plan`, `/stamp/[experienceId]`, `/stamp/[experienceId]/evidence`, `/passport`, `/passport/tokyo`, `/passport/tokyo/[experienceId]`, `/passport/city?city=…`, `/passport/memory?experience=…`, `/auth`, `/auth/reset`, `/account`, `/coming-soon`.

- `lib/repository.ts`: existing asynchronous contract and validated local adapter.
- `lib/store.ts`: explicit local/cloud adapter selection; cloud errors never fall back to local saves.
- `lib/supabase/`: official SDK client, configuration checks, cloud repository and opt-in local import.
- `features/auth/`: session boundary and account screens. Personal routes are gated in the browser; database RLS is the security boundary.
- `supabase/migrations/`: schema, ownership policies, transactional RPCs and public catalogue seeds.
- `features/stamps/`: shared Passport loading and city-independent memories.
- `lib/data.ts`: compiled discovery catalogue; new discovery routes require a rebuild.

See [map layers and animation hooks](docs/home-map-refactor.md), [Milestone 3 audit](docs/milestone-3-audit.md), and [setup, validation and limitations](docs/supabase-setup.md).

Local data keys remain `stamped.profile.v1`, `stamped.plan.v1` and the existing stamp repository key. A browser-only prototype is not synced until the user explicitly imports it into a configured cloud account. No service-role key belongs in this app.

## Assets

- Display typeface: Barlow Condensed, SIL Open Font License (bundled in `public/barlow-OFL.txt`).
- Welcome collage, paper background, illustrated map, and sample Passport artwork: derived from the user-supplied UI reference. These assets are bundled locally; the map is a stylized illustration, not accurate navigation geography.
- Original Tokyo Tower sticker: generated for STAMPED, no artist imitation.
- Akihabara: [Mingfang / Unsplash](https://unsplash.com/photos/EWghkd1LDJc), Unsplash license.
- Tsukiji: [Unsplash source photo](https://unsplash.com/photos/-qPCjfUYCgw), Unsplash license.
- Harajuku: [Intforce, Takeshita Street in December 2018](https://commons.wikimedia.org/wiki/File:Takeshita_Street_in_December_2018.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Original downloaded image; display cropped with CSS. Attribution also appears in the app. Photo remains under its own license.
- Geographic data: [Natural Earth via datasets/geo-countries](https://github.com/datasets/geo-countries), public domain. Coordinates simplified for this app; used as geographic data visualization, not hand-drawn geography.
- Mapbox integration follows [Mapbox source/layer documentation](https://docs.mapbox.com/mapbox-gl-js/guides/styles/work-with-layers/).
