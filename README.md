# Gracia Family

A luxury, monochromatic website for **Gracia Family** — an Italian family restaurant in Andijan,
Uzbekistan. Public site with an interactive dish spotlight, a filterable carta, a pre-order list and
table reservations taken from a plan of the dining room, plus a passcode-protected control room for
the managers. Uzbek, Russian and English, chosen automatically.

Built with TanStack Start (SSR), React 19, Tailwind CSS v4 and Supabase. No animation library — every
motion in the site is CSS keyframes.

## Getting started

```bash
npm install
```

Copy the secret variables into a local, git-ignored file:

```bash
cp .env.example .env.local
```

`.env` carries the public Supabase keys and stays in the repository. `.env.local` is where the
three secrets go — the app tells you which are missing when you open `/admin`:

| Variable                    | What it does                                          | Where to get it                                                                  |
| --------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| `SESSION_SECRET`            | Encrypts the `/admin` session cookie. 32+ characters. | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `ADMIN_PASSCODE`            | The passcode managers type on `/admin`.               | Choose one                                                                       |
| `SUPABASE_SERVICE_ROLE_KEY` | Lets server functions write past RLS.                 | Supabase dashboard → Project Settings → API keys → `service_role`                |

In production set the same three in your host's secret store. Never commit them.

```bash
npm run dev      # dev server
npm run build    # production build
npm run lint     # eslint + prettier
```

## Structure

```
src/
  routes/            file-based routes; __root.tsx is the only layout
  components/        Hero, MenuGrid, ReservationForm, OrderSheet, DishDialog, …
  components/ui/     shadcn primitives
  lib/
    admin.server.ts     session, passcode comparison, login throttling  (server only)
    admin.functions.ts  server functions behind requireAdmin()
    reservations.functions.ts  availability + booking, the only public write path
    telegram.server.ts  booking alerts to the staff chat            (server only)
    floor-plan.ts       the dining room as data — tables, zones, seats
    i18n/               uz/ru/en dictionary and server-side detection
    order.tsx           pre-order list, persisted to localStorage
    queries.ts          react-query options for the public tables
    format.ts           money, Tashkent-local dates, Uzbek phone helpers
  integrations/supabase/
    client.ts           browser client, anon key, RLS enforced
    client.server.ts    service-role client, server only — never import from a route
supabase/migrations/  schema, RLS policies, constraints
```

| Route           | Page                                                  |
| --------------- | ----------------------------------------------------- |
| `/`             | Hero spotlight, story, menu preview, reservation form |
| `/menu`         | Full carta with course filters                        |
| `/reservations` | Booking form                                          |
| `/about`        | 1998 → today                                          |
| `/kids-zone`    | Supervised room and piccolo menu                      |
| `/contact`      | Address, hours, phone, map                            |
| `/admin`        | Manager control room (noindex)                        |

## Data model

Three tables in `public`, all with row-level security:

- **`menu_items`** — the carta. Public read of available dishes; writes only through the service role.
- **`reservations`** — booking requests. Anonymous visitors may _insert_ and nothing else, so nobody
  can read another guest's phone number. A database policy forces every public insert to
  `status = 'pending'` with a date inside a sane window, and CHECK constraints enforce the party
  size, the `+998` phone format and the field lengths regardless of what the browser sends.
  `table_code` records the table picked from the floor plan; a partial unique index on
  `(table_code, reserved_date, reserved_time)` — ignoring cancelled rows — is what actually prevents
  a double booking, so two requests racing for the last free table cannot both win.
- **`site_settings`** — a single row (`id = 1`) holding the hero label, phone, address, hours and
  Instagram handle. Editing it in the control room updates the whole public site.

Apply migrations with the Supabase CLI (`supabase db push`) or by running the files in
`supabase/migrations/` in order.

## Admin

`/admin` asks for `ADMIN_PASSCODE`, compared in constant time and throttled to 8 attempts per IP per
15 minutes. A successful unlock sets an httpOnly, same-site session cookie for 12 hours; `secure` is
required in production and relaxed on `http://localhost` so local development works.

Inside: a reservations dashboard (today's covers, pending count, date/status/name filters, confirm
and cancel), menu CRUD with an image preview and a confirmation step before any delete, and the site
settings form.

Every write is a server function that calls `requireAdmin()` first — the service-role key never
reaches the browser.

## Notes

- **Pre-orders.** "Add to order" builds a list in `localStorage`; taking it into the booking form
  attaches it to the reservation's notes. It is a message to the kitchen, not a payment.
- **Choosing a table.** `/reservations` draws the room — terrace, hall, kids zone, private room — and
  every table is a real radio in a radiogroup, so the whole floor works from the keyboard. Tables too
  small for the party grey out, and taken ones come from a server function that returns table codes
  and nothing else: availability must not leak who booked what.
- **Telegram.** Each booking is pushed to the staff chat. It is best-effort by design — an unset,
  wrong or unreachable bot is logged and swallowed, never allowed to cost a guest their table, and
  `/admin` says plainly whether alerts are on.
- **Dates.** Everything user-facing is computed in `Asia/Tashkent`, not UTC — see
  `todayAtRestaurant()` in `src/lib/format.ts`.
- **Motion.** Every animation is CSS — the intro curtain, the hero carousel, scroll reveals, page
  transitions, the mobile drawer and the booking form all run on keyframes, so the site ships no
  animation library at all. Each one has a `prefers-reduced-motion` branch in `styles.css`, and the
  carousel's autoplay clock stops for reduced motion, on hover and in background tabs.
- **SSR.** The root loader warms the react-query cache, and the router ships it down with the HTML,
  so the carta is in the source that crawlers read.
- **Languages.** Uzbek, Russian and English. The root route's `beforeLoad` resolves the visitor's
  language on the server — cookie first (an explicit choice always wins), then `Accept-Language`
  with its quality values honoured, then the edge's country header — and writes the result back as a
  cookie so hydration matches what was rendered. Country ranks below `Accept-Language` on purpose: a
  Russian-speaking guest and an English-speaking one in Andijan are both in `UZ`, and only the header
  tells them apart. Strings live in `src/lib/i18n/dictionary.ts`, where English is the reference
  shape and `satisfies Dictionary` turns a missing key into a compile error.
- **Type.** Fraunces for display at weight 600 with `SOFT` 28 — thick stems and rounded terminals,
  warm rather than the hairline glamour of a didone — paired with DM Sans for the body. Both are
  variable fonts; Fraunces' optical-size axis adjusts contrast as headings grow.

## Deployment

`npm run build` emits a Nitro server under `.output/`. Nitro auto-detects Vercel, Netlify and
Cloudflare Pages from the CI environment and falls back to a Cloudflare module worker; pin a target
with `NITRO_PRESET` or by editing the `nitro()` options in `vite.config.ts`.

Whatever the host, set `SESSION_SECRET`, `ADMIN_PASSCODE` and `SUPABASE_SERVICE_ROLE_KEY` as secrets
there — they are never read from the repository.

### Vercel

Import the repository and accept the detected framework; no `vercel.json` is needed. The build
writes `.vercel/output/` (Build Output API v3): a single streaming serverless function behind a
catch-all route, with `/assets/*` served as immutable static files.

The function runtime is pinned to `nodejs22.x` in `vite.config.ts`. Left to itself Nitro would
choose `bun1.x` when the build runs under Bun and `nodejs<local major>.x` otherwise, so the same
commit could land on a different engine depending on the CI runner.

Set these in **Project Settings → Environment Variables** before the first deploy. The `VITE_*` ones
are read at build time, so changing them later needs a redeploy, not just a restart:

| Variable                                             | Needed for                                          |
| ---------------------------------------------------- | --------------------------------------------------- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | the browser's Supabase client (build time)          |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`          | every server function — admin, bookings             |
| `SESSION_SECRET`, `ADMIN_PASSCODE`                   | the `/admin` session cookie and its gate            |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`             | booking alerts; optional, `/admin` reports if unset |

Two caveats that follow from serverless, not from this app: the 60-second menu cache in
`server-cache.ts` and the in-memory rate limiters for `/admin` logins and bookings are per-instance,
so each cold lambda starts with its own. Both degrade safely — an extra Supabase query, a limit that
counts per instance rather than globally. Moving either to Supabase or KV is the fix if the
restaurant ever outgrows it.
