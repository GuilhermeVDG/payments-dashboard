import { describe, expect, it } from 'vitest';
import { EMPTY_FILTERS } from '@/domain/filters';
import {
  CLEAR_FILTERS_PATCH,
  FILTER_PARAM_KEYS,
  loadPaymentsSearchParams,
  serializePaymentsSearchParams,
  toFilterState,
  withFilterPatch,
} from '@/state/url-state';

const load = (query: string) => loadPaymentsSearchParams(new URLSearchParams(query));

describe('URL state defaults', () => {
  it('loads defaults from an empty URL', () => {
    expect(load('')).toEqual({
      sort: [{ key: 'created', desc: true }],
      page: 1,
      size: 25,
      date: null,
      from: null,
      to: null,
      status: [],
      method: [],
      amin: null,
      amax: null,
      acur: null,
      q: '',
      tab: null,
    });
    expect(toFilterState(load(''))).toEqual(EMPTY_FILTERS);
  });

  it('omits defaults when serializing', () => {
    expect(serializePaymentsSearchParams(load(''))).toBe('');
    expect(
      serializePaymentsSearchParams({ sort: [{ key: 'created', desc: true }], page: 1, size: 25 }),
    ).toBe('');
  });
});

describe('URL state round-trip', () => {
  const examples = [
    'sort=amount.desc,created.desc',
    'sort=status.asc',
    'page=2&size=50',
    'size=100',
    'date=7d',
    'date=today',
    'from=2026-11-01&to=2026-11-15',
    'status=failed,refunded',
    'method=card,wallet',
    'amin=10&amax=500&acur=usd',
    'amin=10.5',
    'q=4242',
    'q=pi_3Nx',
    'tab=disputed',
  ];

  it.each(examples)('round-trips ?%s', (query) => {
    const serialized = serializePaymentsSearchParams(load(query));
    expect(new URLSearchParams(serialized.replace(/^\?/, ''))).toEqual(new URLSearchParams(query));
  });

  it('round-trips a combined view', () => {
    const query =
      'sort=amount.desc,created.desc&page=3&size=50&date=30d&status=succeeded&method=card&amin=10&amax=500&acur=eur&q=example';
    const state = load(query);
    expect(load(serializePaymentsSearchParams(state).replace(/^\?/, ''))).toEqual(state);
  });
});

describe('URL state parsing', () => {
  it('parses multi-column sort', () => {
    expect(load('sort=amount.desc,created.asc').sort).toEqual([
      { key: 'amount', desc: true },
      { key: 'created', desc: false },
    ]);
  });

  it.each([
    ['unknown key', 'sort=fee.desc', [{ key: 'created', desc: true }]],
    ['bad direction', 'sort=amount.up', [{ key: 'created', desc: true }]],
    ['extra segment', 'sort=amount.desc.x', [{ key: 'created', desc: true }]],
    ['mixed valid and invalid', 'sort=fee.desc,amount.asc', [{ key: 'amount', desc: false }]],
    ['repeated key', 'sort=amount.asc,amount.desc', [{ key: 'amount', desc: false }]],
  ])('ignores invalid sort: %s', (_label, query, expected) => {
    expect(load(query).sort).toEqual(expected);
  });

  it.each(['page=0', 'page=-2', 'page=abc', 'page=1.5'])('falls back to page 1 for %s', (q) => {
    expect(load(q).page).toBe(1);
  });

  it.each(['size=10', 'size=abc', 'size=200'])('falls back to size 25 for %s', (q) => {
    expect(load(q).size).toBe(25);
  });

  it('drops unknown statuses, methods and currencies', () => {
    const state = load('status=failed,disputed&method=crypto,ach&acur=chf');
    expect(state.status).toEqual(['failed']);
    expect(state.method).toEqual(['ach']);
    expect(state.acur).toBeNull();
  });

  it.each(['Infinity', '1e400', '1e3', 'abc', '10abc', '-5', 'NaN', ''])(
    'ignores invalid amount %j instead of crashing',
    (value) => {
      const state = load(`amin=${value}&amax=${value}`);
      expect(state.amin).toBeNull();
      expect(state.amax).toBeNull();
      expect(toFilterState(state).amount).toEqual({ min: null, max: null, currency: null });
    },
  );

  it('parses decimal amounts', () => {
    expect(load('amin=0&amax=10.25')).toMatchObject({ amin: 0, amax: 10.25 });
  });

  it('ignores malformed dates and presets', () => {
    const state = load('date=yesterday&from=2026-02-30&to=11/15/2026');
    expect(state).toMatchObject({ date: null, from: null, to: null });
  });
});

describe('toFilterState', () => {
  it('maps a preset', () => {
    expect(toFilterState(load('date=7d')).date).toEqual({ kind: 'preset', preset: '7d' });
  });

  it('prefers a custom range over a preset', () => {
    expect(toFilterState(load('date=7d&from=2026-11-01&to=2026-11-15')).date).toEqual({
      kind: 'custom',
      from: '2026-11-01',
      to: '2026-11-15',
    });
  });

  it('falls back to the preset when the custom range is reversed', () => {
    expect(toFilterState(load('date=today&from=2026-11-15&to=2026-11-01')).date).toEqual({
      kind: 'preset',
      preset: 'today',
    });
  });

  it('maps amount bounds and currency', () => {
    expect(toFilterState(load('amin=10&amax=500&acur=usd')).amount).toEqual({
      min: 10,
      max: 500,
      currency: 'usd',
    });
  });

  it('drops an invalid amount range but keeps the currency', () => {
    expect(toFilterState(load('amin=500&amax=10&acur=usd')).amount).toEqual({
      min: null,
      max: null,
      currency: 'usd',
    });
    expect(toFilterState(load('amin=-5')).amount.min).toBeNull();
  });

  it('maps the Disputed and Uncaptured tabs and ignores unknown tabs', () => {
    expect(toFilterState(load('tab=uncaptured')).statusTab).toBe('uncaptured');
    expect(toFilterState(load('tab=failed')).statusTab).toBeNull();
  });

  it('maps status, method and query', () => {
    expect(toFilterState(load('status=failed,refunded&method=card&q=4242'))).toMatchObject({
      status: ['failed', 'refunded'],
      method: ['card'],
      query: '4242',
    });
  });
});

describe('filter patches', () => {
  it.each(FILTER_PARAM_KEYS)('resets the page when %s changes', (key) => {
    expect(withFilterPatch({ [key]: null })).toEqual({ [key]: null, page: null });
  });

  it('keeps the patch values and resets the page', () => {
    expect(withFilterPatch({ status: ['failed'], q: '4242' })).toEqual({
      status: ['failed'],
      q: '4242',
      page: null,
    });
  });

  it('clears every filter key and resets the page', () => {
    for (const key of FILTER_PARAM_KEYS) expect(CLEAR_FILTERS_PATCH[key]).toBeNull();
    expect(CLEAR_FILTERS_PATCH.page).toBeNull();
    expect(CLEAR_FILTERS_PATCH).not.toHaveProperty('sort');
    expect(CLEAR_FILTERS_PATCH).not.toHaveProperty('size');
  });
});
