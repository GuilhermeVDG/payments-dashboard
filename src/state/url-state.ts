/**
 * URL state for the payments list. Parsers ignore invalid values (falling back to
 * defaults) and defaults are cleared from the URL, so a link reproduces the view.
 *
 *   ?sort=amount.desc,created.desc&page=2&size=50
 *   ?date=7d | ?from=2026-11-01&to=2026-11-15
 *   ?status=failed,refunded&method=card,wallet
 *   ?amin=10&amax=500&acur=usd&q=4242
 *   ?tab=disputed (Disputed / Uncaptured tabs)
 */
import {
  createLoader,
  createParser,
  createSerializer,
  parseAsArrayOf,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
  type inferParserType,
} from 'nuqs/server';
import { DATE_PRESETS, isValidCustomRange, parseLocalDate, type DateFilter } from '@/domain/dates';
import { validateAmountRange, type AmountFilter, type FilterState } from '@/domain/filters';
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '@/domain/paginate';
import { CURRENCIES, METHOD_TYPES, STATUSES, isOneOf } from '@/domain/payment';
import { DEFAULT_SORT, SORT_KEYS, normalizeSort, type SortRule } from '@/domain/sort';
import { UNAVAILABLE_STATUS_TABS } from '@/domain/status-tabs';

const SORT_DIRECTIONS = ['asc', 'desc'] as const;

function serializeSort(rules: readonly SortRule[]): string {
  return rules.map(({ key, desc }) => `${key}.${desc ? 'desc' : 'asc'}`).join(',');
}

/** `amount.desc,created.desc`. Invalid or repeated entries are dropped. */
export const parseAsSort = createParser<SortRule[]>({
  parse(value) {
    const rules = value.split(',').flatMap((part): SortRule[] => {
      const [key, direction, ...rest] = part.trim().split('.');
      if (rest.length > 0 || !isOneOf(SORT_KEYS, key) || !isOneOf(SORT_DIRECTIONS, direction)) {
        return [];
      }
      return [{ key, desc: direction === 'desc' }];
    });
    const normalized = normalizeSort(rules);
    return normalized.length > 0 ? normalized : null;
  },
  serialize: serializeSort,
  eq: (a, b) => serializeSort(a) === serializeSort(b),
});

/** Positive integer page number. */
export const parseAsPage = createParser<number>({
  parse(value) {
    if (!/^\d+$/.test(value)) return null;
    const page = Number(value);
    return Number.isSafeInteger(page) && page >= 1 ? page : null;
  },
  serialize: String,
});

/** Non-negative decimal amount in major units: `10`, `10.5`. Rejects `Infinity`, `1e3`, `10abc`. */
export const parseAsAmount = createParser<number>({
  parse(value) {
    if (!/^\d+(\.\d+)?$/.test(value)) return null;
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : null;
  },
  serialize: String,
});

/** Local calendar date `YYYY-MM-DD`. */
export const parseAsLocalDate = createParser<string>({
  parse: (value) => (parseLocalDate(value) ? value : null),
  serialize: (value) => value,
});

/** Search waits this long after the last keystroke before filtering and writing the URL. */
export const SEARCH_DEBOUNCE_MS = 200;

export const paymentsSearchParams = {
  sort: parseAsSort.withDefault([...DEFAULT_SORT]),
  page: parseAsPage.withDefault(1),
  size: parseAsNumberLiteral(PAGE_SIZES).withDefault(DEFAULT_PAGE_SIZE),
  date: parseAsStringLiteral(DATE_PRESETS),
  from: parseAsLocalDate,
  to: parseAsLocalDate,
  status: parseAsArrayOf(parseAsStringLiteral(STATUSES)).withDefault([]),
  method: parseAsArrayOf(parseAsStringLiteral(METHOD_TYPES)).withDefault([]),
  amin: parseAsAmount,
  amax: parseAsAmount,
  acur: parseAsStringLiteral(CURRENCIES),
  q: parseAsString.withDefault(''),
  tab: parseAsStringLiteral(UNAVAILABLE_STATUS_TABS),
};

export type PaymentsSearchParams = inferParserType<typeof paymentsSearchParams>;

/** Keys that are filters: changing any of them resets the page. */
export const FILTER_PARAM_KEYS = [
  'date',
  'from',
  'to',
  'status',
  'method',
  'amin',
  'amax',
  'acur',
  'q',
  'tab',
] as const satisfies readonly (keyof PaymentsSearchParams)[];

/** Patch for `setQueryStates` that removes every filter and resets the page. */
export const CLEAR_FILTERS_PATCH = {
  date: null,
  from: null,
  to: null,
  status: null,
  method: null,
  amin: null,
  amax: null,
  acur: null,
  q: null,
  tab: null,
  page: null,
} as const;

export type FilterParamKey = (typeof FILTER_PARAM_KEYS)[number];
export type FilterPatch = Partial<{ [K in FilterParamKey]: PaymentsSearchParams[K] | null }>;

/** Every filter change goes through here so it always resets to page 1. */
export function withFilterPatch(patch: FilterPatch): FilterPatch & { page: null } {
  return { ...patch, page: null };
}

export const loadPaymentsSearchParams = createLoader(paymentsSearchParams);
export const serializePaymentsSearchParams = createSerializer(paymentsSearchParams);

function toDateFilter({
  date,
  from,
  to,
}: Pick<PaymentsSearchParams, 'date' | 'from' | 'to'>): DateFilter {
  if ((from || to) && isValidCustomRange(from, to)) return { kind: 'custom', from, to };
  if (date) return { kind: 'preset', preset: date };
  return { kind: 'all' };
}

function toAmountFilter({
  amin,
  amax,
  acur,
}: Pick<PaymentsSearchParams, 'amin' | 'amax' | 'acur'>): AmountFilter {
  const valid = validateAmountRange(amin, amax) === null;
  return { min: valid ? amin : null, max: valid ? amax : null, currency: acur };
}

/**
 * Converts parsed URL values to domain filter state. A custom range wins over a
 * preset; an invalid custom or amount range is ignored rather than crashing.
 */
export function toFilterState(params: Pick<PaymentsSearchParams, FilterParamKey>): FilterState {
  return {
    date: toDateFilter(params),
    status: params.status,
    method: params.method,
    amount: toAmountFilter(params),
    query: params.q,
    statusTab: params.tab,
  };
}
