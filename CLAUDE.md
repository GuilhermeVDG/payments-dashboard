# payments-dashboard

Take-home project: a payments list screen for a fintech dashboard, with a data table, sorting, pagination and filters over mock data. Full requirements are in `docs/spec.md`. Read it before planning any change.

**Deadline is tight. Ship the required list first, then nice-to-haves in the order of the spec.**

## Stack
- Next.js (App Router), TypeScript strict
- TanStack Table v8 for sorting and pagination
- nuqs for filter, sort and pagination state in the URL
- Radix UI primitives (popover, dropdown menu, tooltip, checkbox) for accessible behavior
- date-fns for date math and relative time
- Styling: Tailwind CSS with design tokens in `src/styles/tokens.css`
- Vitest + Testing Library for tests

## Commands
- `npm run dev`: local server on http://localhost:3000
- `npm test`: run all tests once
- `npx tsc --noEmit`: type check
- `npm run lint`: lint
- `npm run build`: production build
- `npm run generate:data`: regenerate `src/data/payments.json`

## Project layout
```
app/payments/page.tsx              # payments screen (server component shell)
app/payments/[id]/page.tsx         # payment details (nice-to-have)
src/data/payments.json             # generated mock data, committed
scripts/generate-payments.ts       # deterministic generator (seeded PRNG)
src/domain/payment.ts              # types: Payment, Status, PaymentMethod, Currency
src/domain/money.ts                # minor units -> display, zero-decimal currencies
src/domain/filters.ts              # pure filter functions + filter state type
src/domain/search.ts               # search by id, email, last 4
src/domain/dates.ts                # presets (today, 7d, 30d, custom), relative time
src/state/url-state.ts             # nuqs parsers for filters, sort, page, page size
src/components/payments-table/     # table, columns, cells (id + copy, amount, status, method, created)
src/components/filters/            # date, status, method, amount, search controls
src/components/ui/                 # small shared primitives
src/styles/tokens.css              # colors, radii, spacing, font sizes as CSS variables
tests/                             # Vitest tests
```

## How we work
1. **Plan first.** For any non-trivial change, propose a plan and wait for approval.
2. **Small steps.** One piece at a time, stop for review after each one.
3. **Logic is pure and tested.** Filtering, search, sorting comparators, money formatting and date presets live in `src/domain` as pure functions with tests. Components only wire them up.
4. **Done means green.** Before saying a step is done, run `npm test`, `npx tsc --noEmit` and `npm run lint` and show the result.
5. **Ask before adding dependencies** beyond the stack above.
6. **Reproduce the Stripe Dashboard payments screen exactly.** Match its layout, spacing, typography, colors, borders, states and interactions as closely as possible. Put the values in the design tokens in `src/styles/tokens.css` and keep components semantic, with clean structure and class hooks.

## Code rules
- No `any`. Money is always an integer in minor units plus an ISO currency code.
- Format money and dates with `Intl` and an explicit locale (`en-US`), never by hand.
- Zero-decimal currencies (JPY, KRW) must format without decimals.
- All filter state lives in the URL, so a link reproduces the view. Defaults are omitted from the URL.
- Sorting must be stable, and ties are broken by created date desc, then id.
- Client-side filtering and pagination over the full dataset is fine. Memoize derived data.
- Accessibility: every control has a label, popovers are keyboard operable, the copy button announces success, status is not shown by color alone.
- Dates are stored in UTC ISO strings. Display in the user's local time zone.

## Security
- Never read or print `.env` files.
- No real payment data. Mock data only, with emails on `@example.com`.

## Git
- All work goes on the `dev` branch. Create it if needed: `git switch -c dev`. Never commit to `main`.
- Commit after each approved step, one logical change per commit.
- Conventional commits, **one line only**, lowercase, no period, no body:
  - `feat: add payments table with sorting`
  - `test: cover amount range filter`
  - `fix: format zero-decimal currencies`
- Allowed types: `feat`, `fix`, `test`, `refactor`, `chore`, `docs`, `style`.
- Never force push, never push without asking.
