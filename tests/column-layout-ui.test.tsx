import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { Suspense } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DATA_ANCHOR } from '@/data/anchor';
import { PAYMENTS } from '@/data/payments';
import {
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  MOVABLE_COLUMNS,
  RESIZE_STEP,
  moveColumn,
} from '@/domain/column-layout';
import { PaymentsView } from '@/components/payments/payments-view';

const STORAGE_KEY = 'payments-table:column-layout:v1';

beforeEach(() => {
  window.localStorage.clear();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(DATA_ANCHOR));
});

afterEach(() => {
  vi.useRealTimers();
  window.localStorage.clear();
});

function renderView(searchParams = '') {
  const user = userEvent.setup();
  render(
    <NuqsTestingAdapter searchParams={searchParams} hasMemory>
      <Suspense fallback="Loading">
        <PaymentsView payments={PAYMENTS.slice(0, 5)} />
      </Suspense>
    </NuqsTestingAdapter>,
  );
  return user;
}

const headerNames = () =>
  within(screen.getByRole('table'))
    .getAllByRole('columnheader')
    .map((th) => th.className.match(/payments-table__col--([\w-]+)/)?.[1]);

describe('Edit columns', () => {
  it('hides a column, remembers it, and resets to default', async () => {
    const user = renderView();
    await screen.findByRole('table');
    expect(headerNames()).toContain('id');

    await user.click(screen.getByRole('button', { name: 'Edit columns' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit columns' });
    await user.click(within(dialog).getByLabelText('Payment ID'));

    expect(headerNames()).not.toContain('id');
    expect(document.querySelector('.payments-table__col--id')).toBeNull();
    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}').hidden).toEqual(['id']),
    );

    await user.click(within(dialog).getByRole('button', { name: 'Reset to default' }));
    expect(headerNames()).toContain('id');
    expect(within(dialog).getByRole('button', { name: 'Reset to default' })).toBeDisabled();
    // Focus stays in the popover even though the reset button disabled itself.
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(document.body);
  });

  it('does not let a column used for sorting be hidden', async () => {
    const user = renderView('?sort=status.asc');
    await screen.findByRole('table');
    await user.click(screen.getByRole('button', { name: 'Edit columns' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit columns' });
    const status = within(dialog).getByRole('checkbox', { name: /Status/ });
    expect(status).toBeDisabled();
    expect(within(dialog).getByText('(used for sorting)')).toBeInTheDocument();
    expect(within(dialog).getByRole('checkbox', { name: 'Customer' })).toBeEnabled();
  });

  it('does not offer to hide Amount or Date', async () => {
    const user = renderView();
    await screen.findByRole('table');
    await user.click(screen.getByRole('button', { name: 'Edit columns' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit columns' });
    expect(within(dialog).queryByLabelText('Amount')).toBeNull();
    expect(within(dialog).queryByLabelText('Date')).toBeNull();
    expect(within(dialog).getByLabelText('Customer')).toBeChecked();
  });
});

describe('column resizing', () => {
  it('resizes with the keyboard, jumps to min/max with Home/End and resets with Enter', async () => {
    const user = renderView();
    const handle = await screen.findByRole('separator', { name: 'Resize Customer column' });
    const th = handle.closest('th') as HTMLElement;
    const initial = Number.parseInt(th.style.width, 10);
    expect(handle).toHaveAttribute('aria-valuenow', String(initial));

    handle.focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    await waitFor(() => expect(th.style.width).toBe(`${initial + 2 * RESIZE_STEP}px`));
    expect(handle).toHaveAttribute('aria-valuetext', `${initial + 2 * RESIZE_STEP} pixels`);
    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}').sizing?.customer).toBe(
        initial + 2 * RESIZE_STEP,
      ),
    );

    await user.keyboard('{Enter}');
    await waitFor(() => expect(th.style.width).toBe(`${initial}px`));

    await user.keyboard('{Home}');
    await waitFor(() => expect(th.style.width).toBe(`${MIN_COLUMN_WIDTH}px`));
    await user.keyboard('{End}');
    await waitFor(() => expect(th.style.width).toBe(`${MAX_COLUMN_WIDTH}px`));
  });

  it('has no resize handle on pinned columns', async () => {
    renderView();
    await screen.findByRole('table');
    const separators = screen.getAllByRole('separator');
    expect(separators).toHaveLength(MOVABLE_COLUMNS.length);
  });
});

describe('column order', () => {
  it('applies a remembered order together with hidden columns', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        order: moveColumn(MOVABLE_COLUMNS, 'created', 'amount'),
        sizing: {},
        hidden: ['currency'],
      }),
    );
    renderView();
    await screen.findByRole('table');
    expect(headerNames().slice(0, 3)).toEqual(['select', 'created', 'amount']);
    expect(headerNames()).not.toContain('currency');
  });

  it('applies a remembered order, keeping select first and actions last', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        order: moveColumn(MOVABLE_COLUMNS, 'created', 'amount'),
        sizing: {},
        hidden: [],
      }),
    );
    renderView();
    await screen.findByRole('table');
    const names = headerNames();
    expect(names.slice(0, 3)).toEqual(['select', 'created', 'amount']);
    expect(names.at(-1)).toBe('actions');
    // Cells follow the header order.
    const firstRow = within(screen.getByRole('table')).getAllByRole('row')[1];
    expect(firstRow.querySelectorAll('td')[1].className).toContain('payments-table__col--created');
  });

  it('exposes a keyboard-operable drag handle per movable column', async () => {
    renderView();
    const grip = await screen.findByRole('button', { name: 'Reorder Amount column' });
    expect(grip).toHaveAttribute('aria-roledescription', 'sortable');
    expect(grip).toHaveAttribute('tabindex', '0');
  });

  it('ignores a corrupted stored layout', async () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json');
    renderView();
    await screen.findByRole('table');
    expect(headerNames().slice(0, 3)).toEqual(['select', 'amount', 'currency']);
  });
});
