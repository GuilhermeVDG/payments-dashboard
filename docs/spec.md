# Spec: Payments list screen

## Goal
A payments list for a fintech dashboard. Users browse, filter, sort and page through payments, copy an id, and see when a payment was created. Data is mocked locally.

## 1. Data model

```ts
type Currency = 'usd' | 'eur' | 'gbp' | 'brl' | 'cad' | 'aud' | 'jpy';
type Status = 'succeeded' | 'pending' | 'failed' | 'refunded';
type PaymentMethod =
  | { type: 'card'; brand: 'visa' | 'mastercard' | 'amex' | 'discover'; last4: string }
  | { type: 'ach'; bankName: string; last4: string }
  | { type: 'wallet'; wallet: 'apple_pay' | 'google_pay'; brand: 'visa' | 'mastercard'; last4: string };

interface Payment {
  id: string;            // "pi_" + 24 base62 chars
  amount: number;        // integer, minor units (jpy has no minor unit)
  currency: Currency;
  status: Status;
  customer: { name: string; email: string };   // email on @example.com
  method: PaymentMethod;
  created: string;       // ISO 8601 UTC
  description?: string;
  failureReason?: string;  // only when failed
  refundedAt?: string;     // only when refunded
}
```

## 2. Mock data
- `scripts/generate-payments.ts` with a seeded PRNG, so output is identical on every run.
- 600 payments over the last 90 days relative to a fixed anchor date, with more volume on weekdays.
- Status mix: about 78% succeeded, 8% pending, 9% failed, 5% refunded.
- Currency mix: mostly usd, then eur, gbp, cad, brl, aud, jpy.
- Amounts: realistic per currency (most between 10 and 500 in major units, a long tail up to 5,000). jpy amounts are whole yen.
- Methods: about 75% card, 12% ach, 13% wallet.
- Output to `src/data/payments.json`, committed.
- A test checks the generator is deterministic and every row matches the type.

## 3. Table columns
| Column | Content |
|---|---|
| Amount | formatted with currency (`$1,234.56`, `€12.00`, `¥5,000`), plus the uppercase currency code |
| Status | badge: Succeeded, Pending, Failed, Refunded. Text plus icon, not color alone |
| Payment ID | shortened (`pi_3Nx…k2Yt`), full id in a title attribute, copy button with "Copied" feedback |
| Payment method | card brand icon/label and `•••• 4242`; ACH bank and last 4; wallet name plus card last 4 |
| Description | optional, muted |
| Customer | name, email below or in a tooltip |
| Created | date and time (`Nov 19, 2:41 PM`); tooltip on hover with relative time (`3 hours ago`) and the full timestamp |

The column order and labels are adjusted by the user to match the reference.

## 4. Sorting
- Sortable: Created (default, desc), Amount, Status.
- Click toggles asc / desc. Shift-click adds a secondary sort (multi-column).
- Amount sorts by value in minor units within a currency. Across currencies, sort by minor units (no FX conversion) and say so in the README.
- Status order: succeeded, pending, refunded, failed.
- Ties broken by created desc, then id.
- Sort state in the URL: `?sort=amount.desc,created.desc`.

## 5. Pagination
- Page sizes 25 (default), 50, 100.
- Shows "1–25 of 600 results" and previous / next buttons, disabled at the ends.
- Changing any filter or the page size resets to page 1.
- In the URL: `?page=2&size=50`.

## 6. Filters
All filters combine with AND. Each active filter shows as a removable chip, and there's a "Clear filters" action.

### Date range
- Presets: Today, Last 7 days, Last 30 days, Custom.
- Custom: start and end date, inclusive, in the user's local time zone.
- URL: `?date=7d` or `?from=2026-11-01&to=2026-11-15`.

### Status (multi-select)
- Succeeded, Pending, Failed, Refunded. URL: `?status=failed,refunded`.

### Payment method (multi-select)
- Card, ACH, Wallet. URL: `?method=card,wallet`.

### Amount range
- Min and max in major units, inclusive, with a currency selector or "any currency".
- Validates min <= max, shows an inline error otherwise.
- URL: `?amin=10&amax=500&acur=usd`.

### Search
- Matches payment id (prefix or full, case-insensitive), customer email (substring), or last 4 digits (exact, 4 digits).
- Debounced 200 ms. URL: `?q=4242`.

### Empty state
- When nothing matches: a message and a "Clear filters" button.

## 7. Nice-to-haves (in order)
1. Left sidebar with sections (Payments, Customers, Balances, Product catalog). Only Payments works.
2. Top bar with a search input and an account menu.
3. Payment details page at `/payments/[id]` with summary, timeline of events (created, succeeded / failed / refunded) and metadata.
4. Filters in the URL (covered by sections 4 to 6 already).
5. Column resizing and drag to reorder.
6. CSV export of the current filtered and sorted view.

## 8. Non-functional
- Loads and filters 600 rows with no visible lag.
- Keyboard: tab through controls, open and close popovers with Enter / Escape, focus is visible.
- Works on a laptop screen (1280 px) and down to 1024 px. Mobile is not required.
- README: how to run, decisions and trade-offs, what's mocked, and that this is an evaluation project not affiliated with any payment provider.

## 9. Acceptance
- [ ] Generator is deterministic and rows match the type
- [ ] Money formats correctly for usd, eur, gbp, brl and jpy (no decimals)
- [ ] Copy button copies the full id and shows feedback
- [ ] Created tooltip shows relative time and full timestamp
- [ ] Sort by created, amount and status, asc and desc, with stable ties
- [ ] Multi-column sort with shift-click
- [ ] Page sizes 25, 50, 100, and the range label is correct on the last page
- [ ] Filter change resets to page 1
- [ ] Each date preset and a custom range filter correctly, inclusive of both ends
- [ ] Status and method multi-select
- [ ] Amount range inclusive, rejects min > max
- [ ] Search by id prefix, email substring and last 4
- [ ] All state round-trips through the URL
- [ ] Empty state with clear filters
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint` and `npm run build` pass
