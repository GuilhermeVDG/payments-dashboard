import { describe, expect, it } from 'vitest';
import { STATUS_TABS, activeStatusTab, selectStatusTab } from '@/domain/status-tabs';

describe('STATUS_TABS', () => {
  it('lists the reference tabs in order', () => {
    expect(STATUS_TABS.map((t) => t.label)).toEqual([
      'All',
      'Succeeded',
      'Refunded',
      'Disputed',
      'Failed',
      'Uncaptured',
    ]);
  });
});

describe('selectStatusTab', () => {
  it('maps All to no status filter', () => {
    expect(selectStatusTab('all')).toEqual({ status: [], tab: null });
  });

  it.each(['succeeded', 'refunded', 'failed'] as const)('maps %s to a single status', (id) => {
    expect(selectStatusTab(id)).toEqual({ status: [id], tab: null });
  });

  it.each(['disputed', 'uncaptured'] as const)('maps %s to the tab value', (id) => {
    expect(selectStatusTab(id)).toEqual({ status: [], tab: id });
  });
});

describe('activeStatusTab', () => {
  it('is All with no status filter', () => {
    expect(activeStatusTab([], null)).toBe('all');
  });

  it('follows a single matching status', () => {
    expect(activeStatusTab(['failed'], null)).toBe('failed');
    expect(activeStatusTab(['refunded'], null)).toBe('refunded');
  });

  it('is none for statuses without a tab or several statuses', () => {
    expect(activeStatusTab(['pending'], null)).toBeNull();
    expect(activeStatusTab(['failed', 'refunded'], null)).toBeNull();
  });

  it('prefers the Disputed / Uncaptured tab value', () => {
    expect(activeStatusTab([], 'disputed')).toBe('disputed');
  });

  it('round-trips every tab', () => {
    for (const { id } of STATUS_TABS) {
      const { status, tab } = selectStatusTab(id);
      expect(activeStatusTab(status, tab)).toBe(id);
    }
  });
});
