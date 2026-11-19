import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter, type OnUrlUpdateFunction } from 'nuqs/adapters/testing';
import { Suspense } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DATA_ANCHOR } from '@/data/anchor';
import { PAYMENTS } from '@/data/payments';
import { formatFullTimestamp } from '@/domain/dates';
import { formatAmount } from '@/domain/money';
import { PaymentsView } from '@/components/payments/payments-view';

const DATASET = PAYMENTS.slice(0, 30);

// Freeze "now" at the dataset anchor so rebaseToNow is a no-op and relative times are exact.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(DATA_ANCHOR));
});

afterEach(() => {
  vi.useRealTimers();
});

function renderView(searchParams = '') {
  const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
  const user = userEvent.setup();
  render(
    <NuqsTestingAdapter searchParams={searchParams} hasMemory onUrlUpdate={onUrlUpdate}>
      <Suspense fallback="Loading">
        <PaymentsView payments={DATASET} />
      </Suspense>
    </NuqsTestingAdapter>,
  );
  const lastQuery = () => onUrlUpdate.mock.lastCall?.[0].queryString ?? '';
  return { user, onUrlUpdate, lastQuery };
}

const bodyRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);
const header = (name: string) => screen.getByRole('columnheader', { name: new RegExp(name) });
const sortButton = async (name: RegExp) =>
  within(await screen.findByRole('table')).findByRole('button', { name });
const summary = () => screen.getByText(/^Viewing/).textContent;

describe('PaymentsView', () => {
  it('renders the first page with the range label', async () => {
    renderView();
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(25);
    expect(summary()).toBe('Viewing 1–25 of 30 results');
    expect(header('Date')).toHaveAttribute('aria-sort', 'descending');
  });

  it('sorts by amount on click and writes the sort to the URL', async () => {
    const { user, lastQuery } = renderView();
    await user.click(await sortButton(/^Amount/));

    expect(lastQuery()).toBe('?sort=amount.desc');
    expect(header('Amount')).toHaveAttribute('aria-sort', 'descending');
    // Minor units across currencies, no FX: the largest minor amount comes first.
    const largest = DATASET.reduce((a, b) => (b.amount > a.amount ? b : a));
    expect(bodyRows()[0].querySelector('.amount-cell')?.textContent).toBe(
      formatAmount(largest.amount, largest.currency),
    );
  });

  it('toggles direction on a second click', async () => {
    const { user, lastQuery } = renderView();
    const amount = await sortButton(/^Amount/);
    await user.click(amount);
    await user.click(amount);
    expect(lastQuery()).toBe('?sort=amount.asc');
    expect(header('Amount')).toHaveAttribute('aria-sort', 'ascending');
  });

  it('adds a secondary sort with shift-click', async () => {
    const { user, lastQuery } = renderView();
    await user.click(await sortButton(/^Amount/));
    await user.keyboard('{Shift>}');
    await user.click(await sortButton(/^Status/));
    await user.keyboard('{/Shift}');

    expect(lastQuery()).toBe('?sort=amount.desc,status.asc');
    // Only the primary sort carries aria-sort; the secondary is described in text.
    expect(header('Amount')).toHaveAttribute('aria-sort', 'descending');
    expect(header('Status')).toHaveAttribute('aria-sort', 'none');
    expect(header('Status')).toHaveTextContent('secondary sort 2, ascending');
  });

  it('keeps the Status header visually empty, as in the reference, but named', async () => {
    renderView();
    const button = await sortButton(/^Status/);
    const label = within(button).getByText('Status');
    expect(label).toHaveClass('sr-only');
  });

  it('toggles the default Date sort to ascending on click', async () => {
    const { user, lastQuery } = renderView();
    await user.click(await sortButton(/^Date/));
    expect(lastQuery()).toBe('?sort=created.asc');
    expect(header('Date')).toHaveAttribute('aria-sort', 'ascending');
  });

  it('pages forward and disables Next on the last page', async () => {
    const { user, lastQuery } = renderView();
    await user.click(await screen.findByRole('button', { name: 'Next' }));

    expect(lastQuery()).toBe('?page=2');
    expect(bodyRows()).toHaveLength(5);
    expect(summary()).toBe('Viewing 26–30 of 30 results');
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
  });

  it('disables Previous on the first page', async () => {
    renderView();
    expect(await screen.findByRole('button', { name: 'Previous' })).toBeDisabled();
  });

  it('resets to page 1 when the page size changes', async () => {
    const { user, lastQuery } = renderView('?page=2');
    await waitFor(() => expect(summary()).toBe('Viewing 26–30 of 30 results'));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Rows per page' }), '50');

    expect(lastQuery()).toBe('?size=50');
    expect(summary()).toBe('Viewing 1–30 of 30 results');
  });

  it('restores sort, page and size from the URL', async () => {
    renderView('?sort=status.desc&page=2&size=25');
    await waitFor(() => expect(summary()).toBe('Viewing 26–30 of 30 results'));
    expect(header('Status')).toHaveAttribute('aria-sort', 'descending');
  });

  it('copies the full payment id and announces it', async () => {
    const { user } = renderView();
    const first = DATASET[0];
    await user.click(await screen.findByRole('button', { name: `Copy payment ID ${first.id}` }));

    await expect(navigator.clipboard.readText()).resolves.toBe(first.id);
    // A single shared live region announces the result.
    const announcers = document.querySelectorAll('.announcer');
    expect(announcers).toHaveLength(1);
    await waitFor(() => expect(announcers[0]).toHaveTextContent('Copied'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Copied');
  });

  it('copies from the row menu and announces it', async () => {
    const { user } = renderView();
    const first = DATASET[0];
    await user.click(
      await screen.findByRole('button', { name: `More actions for payment ${first.id}` }),
    );
    await user.click(await screen.findByRole('menuitem', { name: 'Copy payment ID' }));

    await expect(navigator.clipboard.readText()).resolves.toBe(first.id);
    await waitFor(() => expect(document.querySelector('.announcer')).toHaveTextContent('Copied'));
  });

  it('shows relative time and the full timestamp in the date tooltip', async () => {
    const { user } = renderView();
    const first = DATASET[0];
    const time = (await screen.findAllByRole('table'))[0].querySelector(
      `time[datetime="${first.created}"]`,
    );
    expect(time).not.toBeNull();
    await user.hover(time as HTMLElement);

    // First row is created 2026-11-19T17:52:35Z, 7 minutes before the frozen now.
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('7 minutes ago');
    expect(tooltip).toHaveTextContent(formatFullTimestamp(first.created));
  });

  it('opens the date tooltip on keyboard focus', async () => {
    renderView();
    const first = DATASET[0];
    const time = (await screen.findByRole('table')).querySelector<HTMLElement>(
      `time[datetime="${first.created}"]`,
    );
    expect(time).not.toBeNull();
    time?.focus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('7 minutes ago');
  });

  it('gives the customer name to screen readers without adding a tab stop', async () => {
    renderView();
    const first = DATASET[0];
    const customer = (await screen.findByRole('table')).querySelector<HTMLElement>(
      '.customer-cell',
    );
    expect(customer).not.toHaveAttribute('tabindex');
    expect(customer).toHaveTextContent(`${first.customer.name}, ${first.customer.email}`);
  });

  it('offers View payment details in the row menu', async () => {
    const { user } = renderView();
    const first = DATASET[0];
    await user.click(
      await screen.findByRole('button', { name: `More actions for payment ${first.id}` }),
    );
    expect(await screen.findByRole('menuitem', { name: 'View payment details' })).toHaveAttribute(
      'href',
      `/payments/${first.id}`,
    );
  });

  it('scopes row selection to the current page', async () => {
    const { user } = renderView();
    const table = await screen.findByRole('table');
    await user.click(
      within(table).getByRole('checkbox', { name: `Select payment ${DATASET[0].id}` }),
    );
    const selectAll = within(table).getByRole('checkbox', {
      name: 'Select all payments on this page',
    });
    expect(selectAll).toHaveAttribute('data-state', 'indeterminate');

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      within(screen.getByRole('table')).getByRole('checkbox', {
        name: 'Select all payments on this page',
      }),
    ).toHaveAttribute('data-state', 'unchecked');

    await user.click(
      within(screen.getByRole('table')).getByRole('checkbox', {
        name: 'Select all payments on this page',
      }),
    );
    const boxes = within(screen.getByRole('table')).getAllByRole('checkbox');
    expect(boxes.every((box) => box.getAttribute('data-state') === 'checked')).toBe(true);
  });

  it('shows the short id with the full id in a title', async () => {
    renderView();
    const first = DATASET[0];
    const short = await screen.findByTitle(first.id);
    expect(short.textContent).toBe(`${first.id.slice(0, 6)}…${first.id.slice(-4)}`);
  });

  it('labels status with text, not color alone', async () => {
    renderView();
    await screen.findByRole('table');
    await waitFor(() => expect(document.querySelectorAll('.status-badge').length).toBe(25));
    for (const badge of document.querySelectorAll('.status-badge')) {
      expect(badge.textContent).toMatch(/^(Succeeded|Pending|Failed|Refunded)$/);
    }
  });
});
