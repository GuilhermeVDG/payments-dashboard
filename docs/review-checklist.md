# Review checklist

## Correctness
- [ ] Money is integer minor units everywhere, formatted only with `Intl.NumberFormat`
- [ ] Zero-decimal currencies have no decimals
- [ ] Date presets use the user's local day boundaries, custom range is inclusive
- [ ] Filters combine with AND, empty filters mean "no filter"
- [ ] Sorting is stable, ties broken by created desc then id
- [ ] Changing filters or page size resets to page 1
- [ ] URL state: defaults omitted, invalid values ignored instead of crashing

## Design
- [ ] Filtering, search, sorting comparators, money and dates are pure functions in `src/domain`
- [ ] Components don't re-implement domain logic
- [ ] Derived rows are memoized, no filtering on every render of every row
- [ ] No `any`, discriminated union for payment methods handled exhaustively

## Accessibility
- [ ] Every control has an accessible name
- [ ] Popovers and menus work with keyboard, Escape closes, focus returns to the trigger
- [ ] Status is readable without color
- [ ] Copy button announces "Copied" (aria-live)
- [ ] Sortable headers expose `aria-sort`

## Tests
- [ ] Every item in `docs/spec.md` section 9 has a test or is checked in the build
- [ ] Domain functions have edge cases: empty input, boundaries, invalid URL values
- [ ] Tests assert behavior, not implementation details

## Hygiene
- [ ] No unused code, no console logs left behind
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` pass
