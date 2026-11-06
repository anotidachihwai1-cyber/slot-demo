# SLOT starter · Zimbabwe first

Working mobile web starter with local demo mode and a Supabase live adapter. Fictional businesses are clearly labelled. No payment is collected. This is an initial customer slice, not a production-complete marketplace.

## Start now

Requires Node 22 or newer. No installation or npm required:

```powershell
node server.mjs
```

On Windows you can also double-click `Start SLOT.cmd` in the extracted folder. Keep the server window open while using the app. Open http://127.0.0.1:5173/ in your browser. This is a local address on your computer, not a public website; it will not work on a phone or another computer without deployment.

Search, filter barbers/nail artists, select a service/date/time, book, view appointments and cancel. Demo data persists on this browser only. It cannot prevent conflicts across different devices. The live PostgreSQL constraint provides that guarantee.

Run `node --test tests/*.test.mjs` for time and overlap checks.

## Exact MVP stack

| Layer | Choice |
|---|---|
| App | Native JavaScript ES modules, HTML5, CSS; no runtime dependencies |
| Local server | Node built-in HTTP, development only |
| Backend | Supabase REST + tightly scoped PostgreSQL RPCs |
| Database | Supabase PostgreSQL, `btree_gist`, RLS |
| Authentication | Supabase email OTP; add phone OTP after testing Zimbabwe SMS delivery and cost |
| Hosting | Cloudflare Pages static deployment |
| Images, later | Supabase Storage with owner-folder upload policies, image size/type restrictions and compressed derivatives |
| Payments, later | Server-side Supabase Edge Function + Paynow adapter |
| Tests | Node built-in test now; PostgreSQL integration tests before live pilot; browser automation as flow grows |

This intentionally simplifies the earlier Next.js proposal. Database functions supply the small backend; a static frontend keeps hosting simple. Add TypeScript/Vite/React when UI complexity justifies a build pipeline. Do not rewrite a working pilot merely to change frameworks. No AI model API is required in the customer product.

## Connect live Supabase

1. Create a fresh Supabase project. Use a region with measured acceptable latency from Zimbabwe; test on actual mobile data.
2. Run `supabase/migrations/001_slot.sql` in its SQL editor. It is a one-time migration, not idempotent. Keep future changes in numbered migrations.
3. Enable email sign-in. Edit the magic-link email template to display `{{ .Token }}` for the code flow. Configure trusted Site URL/redirects, production SMTP, rate limits and CAPTCHA before public signup.
4. Set `url` and `anonKey` in `config.js`. The `anonKey` field accepts the current `sb_publishable_...` public key or a legacy public anon JWT. Secret/service-role keys are rejected. The browser sends the public key in `apikey` and the signed-in user's JWT in `Authorization`; RLS is mandatory.
5. Create a real provider account through the sign-in form, copy its UUID from Auth, and customize `supabase/onboard.sql`. Verify the business in person before publishing. Initial onboarding, hours and services are managed in the dashboard.
6. Serve the app again. A configured app uses real API data only. API errors never silently switch to demo bookings.
7. Register two separate customer accounts and test the database checklist below before inviting customers.

Email OTP is a practical pilot compromise. The frontend stores its session in sessionStorage and refreshes an expiring token before API calls; a failed refresh requires sign-in again. Test real expiry/refresh against your project before pilot. Avoid third-party scripts and add a reviewed Content Security Policy at deployment.

## Database and authorization

| Table | Contents | Client access |
|---|---|---|
| profiles | Private display name and optional +263 phone | Own row only |
| providers | Public business information, private ownership link | Published rows or own row; owner edits name/address/area/bio only |
| services | Duration, buffer, amount in minor units, currency | Read active published services or own business services; admin writes |
| working_hours | One opening interval per weekday per provider | Read published/own hours; admin writes |
| appointments | Booking/block, customer, immutable price/service snapshot, interval, request key | Customer or provider owner reads; writes through RPC only |

One provider is one resource/person. A salon with three workers needs three provider records in this pilot. Add `businesses`, `staff` and service-to-staff assignments before scaling multi-staff salons. Never let a salon-wide calendar serialize three independent workers.

The GiST exclusion constraint rejects overlapping `[start, busy_until)` ranges for the same provider, including buffers and time-off blocks. Adjacent intervals are valid. Cancelled appointments release time. Completed/no-show rows preserve historical occupancy. SQL `book_appointment` computes duration, price, user and provider; the browser cannot submit a cheaper price or another customer UUID. Every booked start must be a valid 30-minute-grid slot inside working hours, at least 30 minutes ahead and at most 60 local calendar days out. Harare dates use `Africa/Harare`; timestamps use `timestamptz`.

Availability is advisory. Two users may see the same time; only one conflicting insert can commit. The booking function serializes the provider and the customer and enforces a 10-upcoming-booking cap. Retrying the SAME request UUID returns the same booking. The form retains its pending UUID in sessionStorage for the same account/service/time across unknown-network-outcome retries. After a connection drop, check My bookings before choosing another time. Cancellation is idempotency-limited: a second cancel reports unavailable rather than changing another row. Rescheduling is deliberately absent; implement it as one database transaction rather than cancel-then-create.

Functions use a fixed empty search path and explicit object names. PUBLIC execute is revoked. There is no client appointment insert/update/delete grant and no provider publication/ownership grant. Admin credentials bypass RLS: keep them out of source and frontend. Customer profiles are not exposed to provider owners; a later contact RPC should disclose only the minimal data for a confirmed appointment. No storage bucket is created yet.

## Database verification required before live use

SQL was authored here but needs execution against your Supabase/PostgreSQL project. No database credentials are included.

- Anonymous user: sees published discovery data and available times; cannot read profiles or appointments, create a booking, publish a provider or modify services.
- Customer A vs B: each sees their own appointment only; neither can cancel the other's appointment. Direct insert/update/delete must fail, even with forged customer/provider/price values.
- Owner A vs B: owner A sees only appointments for A's providers; cannot edit B, change owner_id or published, or complete a future appointment.
- Use two simultaneous authenticated sessions to book the same provider/time with different keys: exactly one succeeds. Test partially overlapping services, buffers, adjacent bookings and distinct providers.
- Retry a successful request with the same key: same ID, one row. Reuse that key with different input: error.
- Block time as provider, then book it as customer: rejected. Try blocking an existing booking: rejected. Cancel the block as owner: time available again.
- Test outside-hours starts, invalid grid, closed days, past time, booking horizon, cancelled release, DST-independent CAT date boundary and a service ending at closing time including buffer.
- Edit hours/services inside a provider-locked transaction while another session books. Inspect booking snapshots and existing appointments. Add automated database integration tests to CI before public launch.

## MVP screens and next coding order

1. **Discover (built):** city/neighbourhood search, two categories, provider cards. No invented ratings.
2. **Provider + booking (built as modal):** service, duration, explicit USD/ZWG price, Harare date/time, pay-at-venue confirmation.
3. **Account (built basic):** email code, sign out. Next: refresh/expiry handling, retries, profile/contact consent.
4. **My bookings (built basic):** status/time and cancellation. Next: provider address, service/price details and business cancellation policy.
5. **Provider day view (next):** owner-filtered bookings, time-off RPC, completion/no-show RPC, manual appointments for WhatsApp/walk-ins. Recording offline bookings is essential for an accurate calendar.
6. **Onboarding/settings (concierge now):** business verification, services, hours, location, preview/publish. Next build owner forms calling reviewed RPCs; keep publication administrator-only.
7. **Operations (dashboard now):** suspend listings, help customers, audit adjustments. Next add append-only audit/outbox events, privacy retention, reporting and notification delivery tracking.

First coding tasks, in order: connect and verify real auth, token refresh and unknown-network-outcome retries; build provider calendar and manual booking RPC; automate SQL authorization/concurrency tests; add reliable confirmation/reminder outbox and monitored worker; then conduct a closed pilot. Add cancellation policy acknowledgement and transactions for rescheduling before advertising them.

## Deploy affordably

Upload only `index.html`, `style.css`, `app.js`, `auth.js`, `booking.js`, `config.js` to Cloudflare Pages (static project, no build command). Do not upload SQL, README, tests or the development server. A build is unnecessary. Google Fonts are optional: system font fallbacks work if unavailable; self-host/subset fonts for the pilot to save requests. No service worker/offline booking queue: a booking must reach PostgreSQL before it is confirmed.

Prototype budget: Cloudflare Pages Free + Supabase Free within current plan limits, plus domain/email as chosen. For a real pilot budget from about USD 25/month for Supabase Pro, plus domain, transactional email, notifications and any usage overages. Check current plans before purchase, configure spending controls where available, backups and restore drills. Vercel Hobby is restricted to personal noncommercial use; do not assume it covers the marketplace.

Sources checked 6 November 2026: [Cloudflare Pages](https://developers.cloudflare.com/pages/), [Supabase pricing](https://supabase.com/pricing), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Vercel Hobby](https://vercel.com/docs/plans/hobby).

## Zimbabwe payments: add after booking reliability

Start with pay-at-venue, no claimed online payment status. Evaluate Paynow with its official developer documentation and merchant onboarding; confirm supported currency, settlement, fees, refunds and marketplace collection/payout arrangements directly. Gateway support alone does not establish permission to hold funds or split settlements.

Later create `payment_attempts` (booking_id, gateway, reference UNIQUE, amount_minor, currency, status, provider_transaction_id UNIQUE, timestamps) and private `payment_events` (gateway event ID UNIQUE, verified payload hash, processing status). Service-role/worker access only; customer gets a narrow payment-status RPC. An Edge Function creates payment requests from trusted booking snapshots. Never accept frontend amount/status, expose integration keys or mark paid from the return URL. Verify callback signatures per official gateway spec and confirm status server-side; deduplicate events, reconcile delayed events and test refunds. Define a deposit hold + expiry transaction before enabling deposits: late payment after slot release needs a refund/manual-resolution path, not a conflicting booking.

Official sources: [Paynow Developer Hub](https://developers.paynow.co.zw/), [integration keys](https://developers.paynow.co.zw/docs/paynow/integration_generation/).

## Growth plan with measurable gates

Pilot one Harare neighbourhood with 10–20 barbers/nail technicians. Help each enter services and all walk-in/WhatsApp bookings, then share their SLOT link and QR in the shop and social bio. Track search → service → slot → confirmed → attended, repeat bookings, no-shows, provider weekly activity and support incidents. Do not collect private contact details in analytics.

Prioritize dependable calendars and repeat use over paid acquisition. Interview inactive providers weekly. After four weeks, expand only if the majority use the calendar every week and customers rebook. Test a USD 5–10/month provider plan through interviews and small paid trials; those are pricing hypotheses, not forecasts. Pay-at-venue commissions are difficult to enforce, so postpone transaction-fee revenue until payment and attribution are reliable. Add genuine completed-booking reviews, favourites, referral attribution and city pages next; public SEO pages can be server-rendered later when discovery warrants it. No revenue or valuation outcome is guaranteed.

## AI-assisted implementation workflow

Give your coding assistant one vertical slice per change: schema migration, access rules, UI, failure states and verification. Example: “Implement an owner-only day calendar using existing appointments RLS. Show CAT times, confirmed bookings and blocks; call block_time for time off. Include loading/empty/error states and prove owner B cannot see owner A's rows. Do not change auth or bypass RLS.” Review database diffs manually. Never paste live integration secrets into prompts. Keep real customer data out of fixtures.
