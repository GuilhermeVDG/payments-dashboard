# payments-dashboard

A rebuild of the Payments screen of a fintech dashboard (Transactions → Payments), with a data table, sorting, pagination, filters and search over mock data.

> **Evaluation project.** Built as a front-end take-home exercise. It is **not affiliated with, endorsed by or connected to Stripe** or any other payment provider. Every payment, customer and account shown is fake; emails use `@example.com`.

- Live demo: https://payments-dashboard-neon.vercel.app
- Spec: [`docs/spec.md`](docs/spec.md)

## Run

Requires Node 22+.

```bash
npm install
npm run dev          # http://localhost:3000 (redirects to /payments)
```

| Command                 | What it does                             |
| ----------------------- | ---------------------------------------- |
| `npm test`              | Vitest + Testing Library, all tests once |
| `npx tsc --noEmit`      | Type check (TypeScript strict)           |
| `npm run lint`          | ESLint (Next.js config)                  |
| `npm run build`         | Production build                         |
| `npm run generate:data` | Regenerate `src/data/payments.json`      |

## What's in it

- **Table:** Amount, currency, status badge (text + icon), payment method (brand / wallet / bank mark and `•••• 4242`), description, customer, payment ID (shortened, copy button that announces "Copied"), date (tooltip with relative time and full timestamp), refunded date, decline reason, row menu. The actions column stays pinned while the table scrolls horizontally.
- **Sorting:** Date (default, newest first), Amount and Status. Click toggles asc/desc, **Shift-click adds a secondary sort**. Ties are broken by created date desc, then id.
- **Pagination:** 25 / 50 / 100 rows, "Viewing 1–25 of 600 results", Previous / Next disabled at the ends.
- **Filters:** status tabs (All, Succeeded, Refunded, Disputed, Failed, Uncaptured) and filter chips (Date and time, Amount, Currency, Status, Payment method). Each active filter is a removable chip; "Clear filters" resets everything. Date presets: Today, Last 7 days, Last 30 days, Custom (inclusive, local time). Amount range is inclusive and rejects min > max inline.
- **Search** (top bar): payment ID prefix, customer email substring or exact card/account last 4. Debounced 200 ms.
- **Empty state** with "Clear filters".
- **Shell:** sidebar and top bar matching the reference, with an account menu. Only Transactions → Payments is wired.
- **URL state:** every filter, sort, page and page size lives in the URL, so a link reproduces the view. Defaults are omitted and invalid values are ignored. Examples: `?sort=amount.desc,created.desc&page=2&size=50`, `?date=7d`, `?from=2026-11-01&to=2026-11-15`, `?status=failed,refunded&method=card,wallet`, `?amin=10&amax=500&acur=usd`, `?q=4242`.
- **Accessibility:** every control is labelled, popovers and menus work with the keyboard (Enter opens, Escape closes, focus returns), sortable headers expose `aria-sort`, status is never shown by color alone, copy results are announced, there is a skip link, and controls the demo does not implement are marked `aria-disabled` with a shared description.

## Stack

Next.js 16 (App Router) · TypeScript strict · TanStack Table v8 · nuqs (URL state) · Radix UI primitives (popover, dropdown menu, tooltip, checkbox) · date-fns · Tailwind CSS v4 with design tokens in `src/styles/tokens.css` · Vitest + Testing Library.

## Project layout

```
app/payments/layout.tsx      dashboard shell (sidebar, top bar, skip link)
app/payments/page.tsx        page header + client view inside Suspense
scripts/                     deterministic mock data generator (seeded PRNG)
src/data/                    committed dataset (600 rows) and its anchor date
src/domain/                  pure, tested logic: money, dates, filters, search,
                             sorting, pagination, chip labels, status tabs
src/state/url-state.ts       nuqs parsers, defaults, filter patches
src/components/              table + cells, filters, layout, UI primitives
src/styles/tokens.css        colors, type, radii, layout as Tailwind @theme tokens
tests/                       domain, URL state, generator and UI tests
```

Filtering, search, sorting comparators, money formatting and date presets are pure functions in `src/domain`; components only wire them up. The view derives rows with a memoized pipeline: rebase → filter → sort → paginate.

## Decisions and trade-offs

- **Amount sorting across currencies uses minor units, with no FX conversion.** ¥1,500 sorts above $10.00 because 1500 > 1000. Converting would need exchange rates, which are out of scope for mock data.
- **Amount filter bounds never widen the range.** Bounds are typed in major units and converted per payment currency. A minimum rounds up and a maximum rounds down to the currency's minor unit, so a max of ¥10.5 excludes ¥11.
- **Mock dates move with the clock.** The dataset is generated relative to a fixed anchor (2026-11-19) so it is identical on every run. At load time it is shifted forward by whole days so the newest payment is always within the last 24 hours, which keeps "Today" and "Last 7 days" meaningful whenever the demo is opened.
- **Dates render in the browser only.** The client view uses React 19's `use(browser())` inside `Suspense`, so dates and day boundaries always use the viewer's time zone with no hydration mismatch.
- **Columns follow the reference, plus a Payment ID column.** The brief requires a shortened payment ID with copy, which the reference screenshot does not show, so it is added after Customer.
- **The status column header is blank, as in the reference.** It is still a sort control with an accessible name; its arrow appears on hover, focus or when it is not the default sort.
- **Statuses: the four in the spec.** The reference also shows Disputed and Uncaptured tabs and Canceled / Blocked badges. The tabs are rendered; Disputed and Uncaptured have no matching mock payments, so they show their own empty state (`?tab=disputed`).
- **The account menu is in the sidebar**, on the account switcher, where the reference puts it. The spec mentions it under the top bar.
- **Placeholders instead of real third parties.** The reference's account name and third-party app logos are replaced by "Acme Inc." and a generic apps icon. Card, wallet and bank marks are simplified generic SVGs.
- **Inert controls.** Create payment, Analyze, the other sidebar sections and the top-bar icons are present for fidelity but are not implemented. They are focusable, marked `aria-disabled` and described as "Not available in this demo". Export and Edit columns are rendered disabled.
- **Font.** The live Dashboard uses the system UI stack (`-apple-system, system-ui, …`), which this project uses too, so it renders the same on macOS. Colors and sizes were measured on the live Dashboard (test mode) with computed styles.
- **Client-side data.** The 600 rows are bundled and filtered in memory. That keeps the demo simple and instant; a real app would page and filter on the server.
- **ACH payments are always USD** and yen amounts are scaled to realistic prices (whole yen, ~¥1,500–¥750,000).

## What's mocked

Everything. There is no backend, no authentication and no payment provider integration. `scripts/generate-payments.ts` writes `src/data/payments.json` with a seeded PRNG (mulberry32): 600 payments over 90 days, weighted toward weekdays, with about 78% succeeded, 8% pending, 9% failed and 5% refunded, mostly USD then EUR, GBP, CAD, BRL, AUD and JPY, and about 75% card, 12% ACH and 13% wallet. A test checks that the generator is deterministic, that the committed JSON is up to date, and that every row matches the `Payment` type.
