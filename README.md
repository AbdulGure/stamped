# STAMPED — Milestone 1

A phone-sized discovery and planning app with an original collage design following the supplied STAMPED UI reference. The app fills phone screens and presents a centered 390px mobile surface on larger screens.

A discovery and planning slice, built with Next.js App Router, React, TypeScript, Tailwind CSS, and Mapbox GL JS. This is a local demo: no authentication, bookings, payments, chat, or stamp creation.

## SVG home refactor

The home map now uses four isolated SVG layers, spring-bounded pan/pinch gestures, screen-sharp vector badges, shared-element sheets and lazy region loading. See [the implementation notes and animation hooks](docs/home-map-refactor.md).

## Launch locally

Requires Node.js 22.18+ and pnpm 11 (the test runner uses native TypeScript support).

```sh
cd /path/to/stamped
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Next.js (normally http://localhost:3000). If your environment has a low file watcher limit, run `WATCHPACK_POLLING=true pnpm dev`.

The development/build scripts use webpack for portability. `pnpm build` produces the static export in `out/`; deploy that directory with clean-URL support. To preview it locally, use any static server supporting `.html` resolution. `next start` does not serve a static export.

## Walk through the complete slice

1. Welcome → **Get Started**.
2. Search/select **London** as home.
3. Choose one or more interests, e.g. **Gaming** and **Food**.
4. Review the seeded destination cards, adjust their travel intents, and keep **Tokyo** → **Let’s Go**.
5. Pan/zoom the Explore map. Click the **Tokyo pagoda / 126** landmark to expand; click map background or press Escape to collapse.
6. **Explore Tokyo** → `/city/tokyo`. Filter experiences by category.
7. Open **Akihabara Electric Town** → `/experience/akihabara-electric-town`.
8. **Add to Plan** → success → **Open my plan**.
9. Reload `/plan`: Akihabara stays saved. Adding twice does not duplicate it. Remove it using its trash button.

Create, Community, and the account link lead to a future-milestone placeholder. Passport shows a clearly labeled sample preview, without stamp creation. My Plan is accessible through the profile icon on Explore and the saved confirmation on an experience.

## Environment variables

Copy `.env.example` to `.env.local` if desired. No variables are required for the demo journey.

- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`: retained as an optional future/legacy integration setting. The refactored SVG home does not use Mapbox or require a token.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`: reserved examples only, not consumed in this milestone. Never put a Supabase service-role key in browser variables.

Restart dev/rebuild the export after changing public environment variables.

## Architecture / files

- `app/`: route wrappers, layout, global style tokens, not-found page.
- `components/`: STAMPED wordmark, navigation, stamp buttons, paper/torn/ticket cards, photo stack, city landmarks, experience cards.
- `features/`: onboarding, interactive map, city filters, experience details, plan actions and saved plan.
- `lib/data.ts`: city, interest and experience seeds.
- `lib/repository.ts`: asynchronous `StampedRepository` contract and validated localStorage adapter. UI does not read/write localStorage directly.
- `lib/store.ts`: adapter wiring. Replace the adapter with a Supabase implementation of the same contract when authentication and tables are introduced.
- `types/`: Profile, City, Interest, TravelIntent, Experience, Itinerary, Plan, PlanItem, Stamp.
- `public/`: local photography, original landmark illustration, simplified map geometry.
- `tests/`: meaningful persistence tests: reload, duplicates, removal, invalid data, unknown IDs, storage failure, onboarding.

Storage is device/browser-local (`stamped.profile.v1`, `stamped.plan.v1`), not account-synced. Storage errors are surfaced and never reported as successful saves. The seeded 126 city experiences and completion counts are illustrative; the browsable first collection contains four records. Community names/tips and cost/duration estimates are seed content, not live recommendations. Shinjuku uses a clearly described atmospheric Tokyo photo rather than a location-specific photograph.

## Validation and scope

Production build, lint, TypeScript and ten physics and repository tests pass. Route and image HTTP checks pass. Browser interaction testing and device-specific motion performance have not been verified. The redesign follows the supplied composition; typography and individual illustrations are not a pixel-for-pixel reproduction. Destination dates and Passport statistics are demonstration content.

## Checks

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The experience page also registers a feature-detected WebMCP `add_current_experience_to_plan` action in compatible browsers. It shares the visible UI's repository action and validates its empty-object input. No supported WebMCP validation context was available here; that optional integration is not verified.

## Assets

- Display typeface: Barlow Condensed, SIL Open Font License (bundled in `public/barlow-OFL.txt`).
- Welcome collage, paper background, illustrated map, and sample Passport artwork: derived from the user-supplied UI reference. These assets are bundled locally; the map is a stylized illustration, not accurate navigation geography.
- Original Tokyo Tower sticker: generated for STAMPED, no artist imitation.
- Akihabara: [Mingfang / Unsplash](https://unsplash.com/photos/EWghkd1LDJc), Unsplash license.
- Tsukiji: [Unsplash source photo](https://unsplash.com/photos/-qPCjfUYCgw), Unsplash license.
- Harajuku: [Intforce, Takeshita Street in December 2018](https://commons.wikimedia.org/wiki/File:Takeshita_Street_in_December_2018.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Original downloaded image; display cropped with CSS. Attribution also appears in the app. Photo remains under its own license.
- Geographic data: [Natural Earth via datasets/geo-countries](https://github.com/datasets/geo-countries), public domain. Coordinates simplified for this app; used as geographic data visualization, not hand-drawn geography.
- Mapbox integration follows [Mapbox source/layer documentation](https://docs.mapbox.com/mapbox-gl-js/guides/styles/work-with-layers/).
