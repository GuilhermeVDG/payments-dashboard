import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { Suspense } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DATA_ANCHOR } from '@/data/anchor';
import { PAYMENTS } from '@/data/payments';
import { PaymentsView } from '@/components/payments/payments-view';

let blobs: Blob[] = [];
let clickedDownload: string | null = null;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(DATA_ANCHOR));
  blobs = [];
  clickedDownload = null;
  URL.createObjectURL = vi.fn((blob: Blob) => {
    blobs.push(blob);
    return 'blob:test';
  });
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    clickedDownload = this.download;
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function renderView(searchParams: string) {
  const user = userEvent.setup();
  render(
    <NuqsTestingAdapter searchParams={searchParams} hasMemory>
      <Suspense fallback="Loading">
        <PaymentsView payments={PAYMENTS} />
      </Suspense>
    </NuqsTestingAdapter>,
  );
  return user;
}

describe('Export', () => {
  it('downloads every filtered and sorted row, not just the current page', async () => {
    const user = renderView('?status=failed&sort=amount.desc');
    await screen.findByRole('table');
    const failed = PAYMENTS.filter((p) => p.status === 'failed');
    expect(failed.length).toBeGreaterThan(25);

    await user.click(screen.getByRole('button', { name: 'Export' }));

    expect(clickedDownload).toBe('payments-2026-11-19.csv');
    const csv = await blobs[0].text();
    const lines = csv
      .replace(/^\uFEFF/, '')
      .trim()
      .split('\r\n');
    expect(lines).toHaveLength(failed.length + 1);
    expect(lines.slice(1).every((line) => line.includes(',Failed,'))).toBe(true);
    const largest = failed.reduce((a, b) => (b.amount > a.amount ? b : a));
    expect(lines[1].startsWith(largest.id)).toBe(true);
    await waitFor(() =>
      expect(document.querySelector('.announcer')).toHaveTextContent(
        `Exported ${failed.length} payments`,
      ),
    );
  });

  it('announces a single exported payment in the singular', async () => {
    const one = PAYMENTS[0];
    const user = renderView(`?q=${one.id}`);
    await screen.findByRole('table');
    await waitFor(() => expect(screen.getByText(/^Viewing/)).toHaveTextContent('Viewing 1 result'));
    await user.click(screen.getByRole('button', { name: 'Export' }));
    await waitFor(() =>
      expect(document.querySelector('.announcer')).toHaveTextContent('Exported 1 payment'),
    );
    expect(document.querySelector('.announcer')).not.toHaveTextContent('payments');
  });

  it('is disabled when nothing matches', async () => {
    renderView('?tab=disputed');
    expect(await screen.findByRole('button', { name: 'Export' })).toBeDisabled();
  });
});
