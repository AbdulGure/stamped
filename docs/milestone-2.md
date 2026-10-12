# Milestone 2 — Stamp and remember

## Implemented journey

Experience → Add to Plan → Plan / Saved → Mark as Complete → Stamp It → physical impact animation and +1 stamp → Make It Yours → optional photographs and reflection → Passport → Tokyo → experience memory.

The approved discovery screens retain their existing design. Plan keeps its day-by-day controls and gains planned/completed status plus completion actions. Passport now shows real locally earned stamps rather than sample counts. Create and Community remain placeholders. No Milestone 3 work was added.

## Architecture

- `types/index.ts`: Stamp, StampPhoto and StampMemory, plus derived plan completion fields.
- `lib/repository.ts`: getStamps, completeExperience and saveStampMemory extend the existing replaceable repository interface. Completion is one synchronous localStorage write. The stamp is the source of truth for plan completion and Passport; this avoids partially updating two storage keys. An experience gets one stamp in this prototype, including repeat presses, reloads and re-adding to Plan. Existing v1 plans remain readable.
- `lib/store.ts`: injects city metadata and retains shared update notifications. UI never calls localStorage directly.
- `lib/photos.ts`: JPG/PNG/WebP decoding, proportional resizing, JPEG compression and object-URL cleanup. No external upload or photo service.
- `features/stamps/use-passport.ts`: loading/error lifecycle and local/cross-tab refresh notifications.
- `components/stamps/`: reusable CityStamp, StampAnimation, EvidenceUploader, ReflectionForm, MemoryCard and MemoryDetails. CityStamp reuses the original vector pagoda. CSS handles the wooden stamp descent, rotation, rebound, paper impact, ink reveal and reward. Reduced-motion users receive the stamp without impact motion.
- `features/stamps/`: completion, evidence, Passport, city chapter and memory screens with scoped styling.
- `app/stamp/[experienceId]` and `app/stamp/[experienceId]/evidence`: static routes for the four existing experiences.
- `app/passport`, `app/passport/tokyo`, `app/passport/tokyo/[experienceId]`: the collection and personal memories.
- `features/plan.tsx`, `features/plan-actions.tsx`, `components/experience-card.tsx`: completion and View Memory actions; existing day planning retained.
- `components/ui.tsx`, `features/coming-soon.tsx`, `app/coming-soon/page.tsx`: approved navigation and correct placeholder destination highlighting.
- `tests/repository.test.ts`: completion, duplicate prevention, evidence, validation, photo limits, migration and failed-write coverage alongside existing tests.
- `next.config.ts`, `.gitignore`, `eslint.config.mjs`, `tsconfig.json`, `next-env.d.ts`: isolated development output for the 3001 preview and loopback-only extra development origin. This avoids the other running development instance's build lock.

## Validation

Browser journey completed using the separate test origin `http://127.0.0.1:3001`, leaving `localhost:3001` saved data untouched. Added Akihabara, opened Plan, marked complete, pressed Stamp It, observed the physical stamp and reward, uploaded the bundled Akihabara demo photograph, entered 5 stars / £42 / 180 minutes / a tip, saved, opened Passport → Tokyo → memory, and refreshed. The photograph and every reflection field survived. Returning to the original experience showed View Memory; Plan showed Completed; reopening completion showed Already Stamped rather than another Stamp It action. Console error check was empty. Checked the completed screen at 375×667 and adjusted short-screen spacing.

The file chooser required a second attempt during browser automation; the final single-photo journey completed successfully. Five-photo limits, cover replacement and photo removal are additionally covered by repository tests. Native iPhone/Safari testing and reduced-motion OS testing remain manual follow-ups.

## Prototype limits

- Data belongs to this browser and origin. Clearing browser storage removes it; no account or cloud sync.
- 1–5 photos per memory, optional. JPG, PNG and WebP supported; HEIC requires conversion. Originals stay on the user's device. Photos are resized to at most 1000 pixels and compressed for localStorage; the album caps its serialized data at 3.5 million characters. Quota failures show an error and leave the earned stamp intact.
- Amount spent is optional GBP; there is no currency conversion. Itinerary statistic stays 0 as permitted by this milestone.
- One completion per experience; no repeat-visit stamps, verification, GPS, social features or bookings.
- Evidence drafts are not saved until Save My Memory. Refresh/close warns after edits; internal navigation discards unsaved edits.
- Local synchronous persistence avoids partial completion writes, but simultaneous edits to the same memory in different tabs use last-write-wins semantics. Supabase can later implement the same repository contract with transactional server storage.

## Local development

`STAMPED_DEV_DIR=.next-preview pnpm dev --port 3001` starts the isolated preview. Open `http://localhost:3001/experience/akihabara-electric-town`. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` for validation.
