# Day-by-day Tokyo planner

Open `/plan` or tap Plan in the bottom navigation. New plans start with three flexible days; dates are not required. Experiences added from discovery enter Saved. Use the selector on each stop to assign it to a day or return it to Saved. The inline picker adds any of the four available Tokyo experiences directly to the current day.

Arrow controls reorder stops within their own day. Add up to 30 days. Removing the last day returns its stops to Saved. All changes use the existing local repository and persist on this browser/device; there is no account syncing yet. Existing v1 plans migrate on read without losing saved experiences. Invalid day assignments recover to Saved.

`features/plan.tsx` and `features/plan.css` contain the mobile planner, with spring layout transitions, reduced-motion support, labelled controls, status feedback, and storage error handling. `lib/repository.ts` owns validated day assignment, order and trip-length changes. The plan storage key stays unchanged for compatibility.

Validation: 18 automated tests pass, including legacy migration, reload persistence, within-day ordering, day removal and invalid-edit rejection. ESLint, TypeScript and the production static build pass. Real-device gesture and visual testing remains to be done.
