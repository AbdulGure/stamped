# Supabase setup and release checklist

## Configure a project

1. Create a Supabase project. Use a fresh development project first. These migrations create new tables; do not run blindly against an existing schema with conflicting names.
2. In the SQL Editor run these files once, in order:
   - `supabase/migrations/202610120001_core.sql`
   - `supabase/migrations/202610120002_security.sql`
   - `supabase/migrations/202610120003_transactions.sql`
   - `supabase/migrations/202610120004_seed.sql`
   Alternatively, link the repository to the intended project with the Supabase CLI, inspect pending migrations, and run `supabase db push`. Do not reset an existing database. Back up existing data before migration. Files are additive and are not intended to be manually replayed after successful application.
3. Verify the 13 public tables, RPCs, RLS and private `stamp-evidence` bucket were created. Seeds are published catalogue content only, not user plans or stamps.
4. Enable email/password Auth. Enable email confirmation and configure an SMTP provider for real users. Set the Auth Site URL to the deployed HTTPS origin and allow exact redirect URLs `${origin}/auth` and `${origin}/auth/reset`. Add localhost equivalents for development. Phone/network origins also need allowlisting. See [Supabase password Auth](https://supabase.com/docs/guides/auth/passwords).
5. Copy `.env.example` to ignored `.env.local`:

```dotenv
NEXT_PUBLIC_DATA_MODE=cloud
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is accepted instead of the publishable key. Do not set both unnecessarily. Never expose a service-role or `sb_secret_` key. No server secret is needed. Mapbox is not required.

6. Restart the development server, or rebuild and deploy `out/` with clean URL resolution. Environment variables are embedded at build time. Use `NEXT_PUBLIC_DATA_MODE=local` to run the original browser prototype deliberately; missing cloud settings show an error rather than silently saving locally.

## Authentication and ownership

The official `@supabase/supabase-js` client manages persistent sessions, token refresh and email redirect sessions in this static client application. There is no server cookie/middleware dependency. `/plan`, `/passport`, `/stamp`, `/onboarding` and `/account` require a restored session in cloud mode. RLS and RPC ownership checks enforce security independently of UI gating. Public catalogue rows are readable only when published. No user ID from the browser is trusted by mutation RPCs.

The same client/provider boundary can host future OAuth sign-in. Apple/Google providers and UI are not implemented in this milestone.

Private Storage objects use `user-id/stamp-id/random-file.jpg` paths. Policies check ownership; reads use short-lived signed URLs, refreshed on window focus and periodically. Photos are private, with no sharing feature. Do not publish signed URLs. See [Storage access control](https://supabase.com/docs/guides/storage/security/access-control).

## Photos and import

Choose JPG, PNG or WebP, up to 20 MB before preparation. Photos are resized to a maximum 1000px edge and compressed before upload. HEIC/HEIF must first be exported as JPEG (on Mac, Preview → Export → JPEG; on iPhone, use a JPEG conversion/export workflow or Camera → Formats → Most Compatible for future pictures). Each stamp supports up to five photos, with zero allowed for a standard stamp or after deleting all evidence. Progress is per-file/transaction progress, not a byte-accurate network meter.

Uploads precede the metadata transaction; failed writes attempt to remove newly uploaded files. Removed photos are deleted after successful metadata replacement. Network failure during cleanup can leave private orphan files; the UI reports the failure. Administrators should reconcile unreferenced objects before a production rollout. Replaced metadata and reflections are atomic; Storage and PostgreSQL cannot share one transaction.

My Account provides a JSON backup of this browser's local data and an explicit, account-labelled import checkbox. Import keeps local originals, adds missing plan items/stamps, preserves completion dates and gives existing cloud memories precedence. It can be retried after partial failure. Only data accessible in this browser/origin can be imported; there is no JSON file restoration UI. Export before moving domains or clearing browser storage. Demo records are never imported automatically.

## Verification performed

- Lint, TypeScript, production static export (35 routes), and all 29 tests passed.
- Final browser walkthrough was blocked by the browser automation URL security policy; visual/browser interactions were not verified in this run.
- 25 existing repository, stamp and map tests retained.
- Three configuration/redirect tests and one PostgreSQL integration test added (29 total).
- PostgreSQL tests run all four migrations in PGlite, with test Auth/Storage schemas and roles. They exercise profile preferences, plan changes, duplicate completion prevention, reflection/photo metadata, transaction rollback and two-user read/write isolation, including Storage path ownership.
- These tests do **not** exercise Supabase's live Auth service, mail delivery, PostgREST embedding, file upload service or signed URLs. They are not a claim of live cloud or cross-device verification.

## Required live acceptance pass

With the configured development project:

1. Sign up Alice, confirm email, finish onboarding, refresh and check preferences/session.
2. Explore Tokyo, save Akihabara, assign/reorder it, reload, complete it twice and verify only one stamp.
3. Upload 1–5 photos, select cover, save rating/spending/duration/tip; open Passport and memory. Delete a photo, reload and check removal.
4. Log out; personal pages must prompt for login. Log back in and verify memories/photos.
5. Log in as Alice on another browser/phone and verify the same data.
6. Create Bob. His Passport/plan must be separate; attempts to read/write Alice's rows or private Storage paths must fail.
7. Reset a password via email and verify the new password. Test expired links and offline errors.
8. Add London South Bank from the plan picker, complete it and verify separate London/Tokyo Passport counts.
9. Test opt-in import on a browser holding prototype data, then repeat it; confirm no duplicate completions and local originals remain.

Live acceptance remains unverified until project credentials are supplied and this pass is executed.

## Remaining limits

Discovery/experience editing routes use the compiled seed catalogue. Passport can display any cloud city/experience, but editing an experience added outside the build requires adding it to the catalogue and rebuilding. London has a seed detail/plan entry, not a full city discovery page. Itinerary publishing, social feeds, sharing, OAuth, bookings and other later milestones are intentionally absent. The old optional WebMCP browser integration has not been verified in a supporting browser.
