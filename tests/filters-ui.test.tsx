import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter, type OnUrlUpdateFunction } from 'nuqs/adapters/testing';
import { Suspense } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DATA_ANCHOR } from '@/data/anchor';
import { PAYMENTS } from '@/data/payments';
import { SearchInput } from '@/components/filters/search-input';
import { PaymentsView } from '@/components/payments/payments-view';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(DATA_ANCHOR));
});

afterEach(() => {
  vi.useRealTimers();
});

function renderScreen(searchParams = '') {
  const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
  const user = userEvent.setup();
  render(
    <NuqsTestingAdapter searchParams={searchParams} hasMemory onUrlUpdate={onUrlUpdate}>
      <SearchInput />
      <Suspense fallback="Loading">
        <PaymentsView payments={PAYMENTS} />
      </Suspense>
    </NuqsTestingAdapter>,
  );
  const lastQuery = () => onUrlUpdate.mock.lastCall?.[0].queryString ?? '';
  return { user, lastQuery };
}

const chips = () => within(screen.getByRole('group', { name: 'Filters' }));
const summary = () => screen.getByText(/^Viewing/).textContent;
const badges = () => [...document.querySelectorAll('.status-badge')].map((b) => b.textContent);

async function openChip(user: ReturnType<typeof userEvent.setup>, label: string) {
  await screen.findByRole('table');
  await user.click(chips().getByRole('button', { name: new RegExp(`^${label}`) }));
  return screen.findByRole('form', { name: new RegExp(label, 'i') });
}

describe('status filter', () => {
  it('multi-selects statuses, writes the URL, shows the chip value and resets the page', async () => {
    const { user, lastQuery } = renderScreen('?page=3');
    const form = await openChip(user, 'Status');
    await user.click(within(form).getByLabelText('Failed'));
    await user.click(within(form).getByLabelText('Refunded'));
    await user.click(within(form).getByRole('button', { name: 'Apply' }));

    expect(lastQuery()).toBe('?status=failed,refunded');
    expect(chips().getByRole('button', { name: 'Status: Failed, Refunded' })).toBeInTheDocument();
    expect(new Set(badges())).toEqual(new Set(['Failed', 'Refunded']));
    expect(summary()).toMatch(/^Viewing 1–25 of \d+ results$/);
  });

  it('clears from the chip remove button and resets the page', async () => {
    const { user, lastQuery } = renderScreen('?status=failed&page=2');
    await screen.findByRole('table');
    await user.click(chips().getByRole('button', { name: 'Clear Status filter' }));
    expect(lastQuery()).toBe('');
    expect(chips().getByRole('button', { name: 'Status' })).toHaveFocus();
    expect(summary()).toBe('Viewing 1–25 of 600 results');
  });
});

describe('payment method filter', () => {
  it('multi-selects methods', async () => {
    const { user, lastQuery } = renderScreen();
    const form = await openChip(user, 'Payment method');
    await user.click(within(form).getByLabelText('Card'));
    await user.click(within(form).getByLabelText('Wallet'));
    await user.click(within(form).getByRole('button', { name: 'Apply' }));

    expect(lastQuery()).toBe('?method=card,wallet');
    expect(chips().getByText('Card, Wallet')).toBeInTheDocument();
    expect(document.querySelectorAll('.method-cell')).not.toHaveLength(0);
    for (const cell of document.querySelectorAll('.method-cell')) {
      expect(cell.getAttribute('title')).not.toMatch(/account ending/);
    }
  });
});

describe('date filter', () => {
  it('applies a preset', async () => {
    const { user, lastQuery } = renderScreen();
    const form = await openChip(user, 'Date and time');
    await user.click(within(form).getByLabelText('Last 7 days'));
    await user.click(within(form).getByRole('button', { name: 'Apply' }));

    expect(lastQuery()).toBe('?date=7d');
    expect(chips().getByText('Last 7 days')).toBeInTheDocument();
  });

  it('applies a custom range and rejects a reversed one', async () => {
    const { user, lastQuery } = renderScreen();
    const form = await openChip(user, 'Date and time');
    await user.click(within(form).getByLabelText('Custom'));
    await user.type(within(form).getByLabelText('Start date'), '2026-11-15');
    await user.type(within(form).getByLabelText('End date'), '2026-11-01');

    expect(within(form).getByRole('alert')).toHaveTextContent(
      'Start date must be on or before the end date.',
    );
    expect(within(form).getByRole('button', { name: 'Apply' })).toBeDisabled();

    await user.clear(within(form).getByLabelText('End date'));
    await user.type(within(form).getByLabelText('End date'), '2026-11-18');
    await user.click(within(form).getByRole('button', { name: 'Apply' }));
    expect(lastQuery()).toBe('?from=2026-11-15&to=2026-11-18');
    expect(chips().getByText('Nov 15, 2026 – Nov 18, 2026')).toBeInTheDocument();
  });
});

describe('amount filter', () => {
  it('rejects min greater than max with an inline error', async () => {
    const { user } = renderScreen();
    const form = await openChip(user, 'Amount');
    await user.type(within(form).getByLabelText('Minimum'), '500');
    await user.type(within(form).getByLabelText('Maximum'), '10');

    expect(within(form).getByRole('alert')).toHaveTextContent(
      'Minimum amount must be less than or equal to the maximum.',
    );
    expect(within(form).getByLabelText('Minimum')).toHaveAttribute('aria-invalid', 'true');
    expect(within(form).getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('applies an inclusive range with a currency', async () => {
    const { user, lastQuery } = renderScreen();
    const form = await openChip(user, 'Amount');
    await user.selectOptions(within(form).getByLabelText('Currency'), 'usd');
    await user.type(within(form).getByLabelText('Minimum'), '10');
    await user.type(within(form).getByLabelText('Maximum'), '500');
    await user.click(within(form).getByRole('button', { name: 'Apply' }));

    expect(lastQuery()).toBe('?amin=10&amax=500&acur=usd');
    expect(chips().getByText('$10.00 – $500.00')).toBeInTheDocument();
    expect(chips().getByText('USD')).toBeInTheDocument();
    for (const cell of document.querySelectorAll('.currency-cell')) {
      expect(cell.textContent).toBe('USD');
    }
  });
});

describe('search', () => {
  it('filters by last 4 after the debounce, writes the URL and resets the page', async () => {
    const { user, lastQuery } = renderScreen('?page=3');
    await screen.findByRole('table');
    await user.type(screen.getByRole('searchbox'), '4242');

    // Right after typing the page has reset but results are not filtered yet.
    expect(screen.getByRole('searchbox')).toHaveValue('4242');
    expect(summary()).toBe('Viewing 1–25 of 600 results');

    await waitFor(() => expect(lastQuery()).toBe('?q=4242'));
    await waitFor(() => {
      const last4 = [...document.querySelectorAll('.method-cell__last4')].map((c) => c.textContent);
      expect(last4.length).toBeGreaterThan(0);
      expect(last4.every((text) => text === '•••• 4242')).toBe(true);
    });
  });
});

describe('currency filter', () => {
  it('restricts to one currency and shares the value with the amount filter', async () => {
    const { user, lastQuery } = renderScreen();
    const form = await openChip(user, 'Currency');
    await user.click(within(form).getByLabelText('EUR'));
    await user.click(within(form).getByRole('button', { name: 'Apply' }));

    expect(lastQuery()).toBe('?acur=eur');
    expect(chips().getByRole('button', { name: 'Currency: EUR' })).toBeInTheDocument();
    for (const cell of document.querySelectorAll('.currency-cell')) {
      expect(cell.textContent).toBe('EUR');
    }

    const amountForm = await openChip(user, 'Amount');
    expect(within(amountForm).getByLabelText('Currency')).toHaveValue('eur');
  });
});

describe('amount filter input validation', () => {
  it('flags a malformed amount on the offending field only', async () => {
    const { user } = renderScreen();
    const form = await openChip(user, 'Amount');
    await user.type(within(form).getByLabelText('Minimum'), 'abc');

    expect(within(form).getByRole('alert')).toHaveTextContent('Enter a valid amount.');
    expect(within(form).getByLabelText('Minimum')).toHaveAttribute('aria-invalid', 'true');
    expect(within(form).getByLabelText('Maximum')).toHaveAttribute('aria-invalid', 'false');
    expect(within(form).getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('includes payments exactly on both bounds', async () => {
    const { user } = renderScreen();
    const form = await openChip(user, 'Amount');
    await user.selectOptions(within(form).getByLabelText('Currency'), 'usd');
    await user.type(within(form).getByLabelText('Minimum'), '14.99');
    await user.type(within(form).getByLabelText('Maximum'), '14.99');
    await user.click(within(form).getByRole('button', { name: 'Apply' }));

    const amounts = [...document.querySelectorAll('.amount-cell')].map((c) => c.textContent);
    expect(amounts.length).toBeGreaterThan(0);
    expect(new Set(amounts)).toEqual(new Set(['$14.99']));
  });
});

describe('empty state', () => {
  it('shows a message and clears every filter', async () => {
    const { user, lastQuery } = renderScreen('?status=failed&q=nobody-matches-this');
    const title = await screen.findByRole('heading', { name: 'No results found' });
    const emptyState = title.closest('.empty-state') as HTMLElement;
    await user.click(within(emptyState).getByRole('button', { name: 'Clear filters' }));

    expect(lastQuery()).toBe('');
    expect(await screen.findByRole('table')).toBeInTheDocument();
    await waitFor(() => expect(summary()).toBe('Viewing 1–25 of 600 results'));
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(chips().getByRole('button', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Filters' })).toHaveFocus();
  });

  it('shows the Clear filters action in the chip row only when filters are active', async () => {
    renderScreen();
    await screen.findByRole('table');
    expect(chips().queryByRole('button', { name: 'Clear filters' })).toBeNull();
  });
});

describe('status tabs', () => {
  it('filters by a single status, marks the tab pressed and resets the page', async () => {
    const { user, lastQuery } = renderScreen('?page=2');
    await screen.findByRole('table');
    await user.click(screen.getByRole('button', { name: 'Failed', pressed: false }));

    expect(lastQuery()).toBe('?status=failed');
    expect(screen.getByRole('button', { name: 'Failed', pressed: true })).toBeInTheDocument();
    expect(new Set(badges())).toEqual(new Set(['Failed']));
  });

  it('shows the empty state on Disputed', async () => {
    const { user, lastQuery } = renderScreen();
    await screen.findByRole('table');
    await user.click(screen.getByRole('button', { name: 'Disputed' }));

    expect(lastQuery()).toBe('?tab=disputed');
    expect(
      await screen.findByRole('heading', { name: 'No disputed payments' }),
    ).toBeInTheDocument();
    expect(document.querySelector('.payments-view__results-status')).toHaveTextContent(
      'No disputed payments',
    );
  });
});

describe('keyboard', () => {
  it('opens a filter popover with Enter and closes it with Escape, returning focus', async () => {
    const { user } = renderScreen();
    await screen.findByRole('table');
    const trigger = chips().getByRole('button', { name: /^Status/ });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('form', { name: /status/i })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('form', { name: /status/i })).toBeNull());
    expect(trigger).toHaveFocus();
  });

  it('returns focus to the chip after applying', async () => {
    const { user } = renderScreen();
    const form = await openChip(user, 'Status');
    await user.click(within(form).getByLabelText('Pending'));
    await user.click(within(form).getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(screen.queryByRole('form', { name: /status/i })).toBeNull());
    expect(chips().getByRole('button', { name: 'Status: Pending' })).toHaveFocus();
  });
});

describe('More filters', () => {
  it('is present for fidelity but marked unavailable', async () => {
    renderScreen();
    await screen.findByRole('table');
    expect(chips().getByRole('button', { name: 'More filters' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});
