import type { Payment, Status } from './payment';

export const SORT_KEYS = ['created', 'amount', 'status'] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export interface SortRule {
  key: SortKey;
  desc: boolean;
}

export const DEFAULT_SORT: readonly SortRule[] = [{ key: 'created', desc: true }];

/** Business order for status sorting (ascending). */
export const STATUS_SORT_ORDER: Record<Status, number> = {
  succeeded: 0,
  pending: 1,
  refunded: 2,
  failed: 3,
};

type Comparator = (a: Payment, b: Payment) => number;

/** Code-unit string comparison, independent of the runtime locale. */
export function compareCodeUnits(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function compareNumbers(a: number, b: number): number {
  return a - b;
}

/**
 * Ascending comparators. Amount compares minor units with no FX conversion.
 * Created parses timestamps rather than comparing strings so `...:00Z` and
 * `...:00.000Z` order correctly; 600 rows make the cost negligible.
 */
const ASCENDING: Record<SortKey, Comparator> = {
  created: (a, b) => compareNumbers(Date.parse(a.created), Date.parse(b.created)),
  amount: (a, b) => compareNumbers(a.amount, b.amount),
  status: (a, b) => compareNumbers(STATUS_SORT_ORDER[a.status], STATUS_SORT_ORDER[b.status]),
};

/** Canonical order and final tie-break: created desc, then id asc. */
export function compareNewestFirst(a: Payment, b: Payment): number {
  return -ASCENDING.created(a, b) || compareCodeUnits(a.id, b.id);
}

/** Drops repeated keys, keeping the first occurrence (the higher priority rule). */
export function normalizeSort(rules: readonly SortRule[]): SortRule[] {
  const seen = new Set<SortKey>();
  return rules.filter((rule) => {
    if (seen.has(rule.key)) return false;
    seen.add(rule.key);
    return true;
  });
}

export function comparePayments(rules: readonly SortRule[]): Comparator {
  const active = normalizeSort(rules);
  return (a, b) => {
    for (const { key, desc } of active) {
      const result = ASCENDING[key](a, b);
      if (result !== 0) return desc ? -result : result;
    }
    return compareNewestFirst(a, b);
  };
}

/** Returns a new sorted array; the input is not mutated. */
export function sortPayments(payments: readonly Payment[], rules: readonly SortRule[]): Payment[] {
  return [...payments].sort(comparePayments(rules));
}
