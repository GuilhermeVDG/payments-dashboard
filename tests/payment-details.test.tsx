import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { Suspense } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DATA_ANCHOR } from '@/data/anchor';
import { PAYMENTS } from '@/data/payments';
import { formatAmount } from '@/domain/money';
import { SearchInput } from '@/components/filters/search-input';
import { PaymentDetails } from '@/components/payment-details/payment-details';
import { PaymentsView } from '@/components/payments/payments-view';
import { findPayment } from '@/domain/payment';
import { shortenPaymentId } from '@/domain/display';
import PaymentNotFound from '../app/payments/[id]/not-found';
import { navigation } from './mocks/navigation';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(DATA_ANCHOR));
});

afterEach(() => {
  vi.useRealTimers();
});

const refunded = PAYMENTS.find((p) => p.status === 'refunded');
const failed = PAYMENTS.find((p) => p.status === 'failed');

function renderDetails(payment = PAYMENTS[0]) {
  render(
    <Suspense fallback="Loading">
      <PaymentDetails payment={payment} />
    </Suspense>,
  );
}

describe('PaymentDetails', () => {
  it('shows the amount, status, id and a breadcrumb back to payments', async () => {
    const payment = PAYMENTS[0];
    renderDetails(payment);
    const title = await screen.findByRole('heading', { level: 1 });
    expect(title).toHaveTextContent(formatAmount(payment.amount, payment.currency));
    const breadcrumb = within(screen.getByRole('navigation', { name: 'Breadcrumb' }));
    expect(breadcrumb.getByRole('link', { name: 'Payments' })).toHaveAttribute('href', '/payments');
    expect(breadcrumb.getByText(shortenPaymentId(payment.id))).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('button', { name: `Copy payment ID ${payment.id}` }),
    ).toBeInTheDocument();
  });

  it('renders the timeline newest first, with the refund on top', async () => {
    expect(refunded).toBeDefined();
    renderDetails(refunded);
    const timeline = within(await screen.findByRole('region', { name: 'Timeline' }));
    const titles = timeline
      .getAllByRole('listitem')
      .map((li) => li.querySelector('.payment-details__event-title')?.textContent);
    expect(titles).toEqual(['Payment refunded', 'Payment succeeded', 'Payment started']);
  });

  it('shows the decline reason for failed payments', async () => {
    expect(failed).toBeDefined();
    renderDetails(failed);
    const details = within(await screen.findByRole('region', { name: 'Payment details' }));
    expect(details.getByText('Decline reason')).toBeInTheDocument();
    expect(details.getByText(failed?.failureReason ?? '')).toBeInTheDocument();
  });

  it('lists payment method and metadata', async () => {
    const payment = PAYMENTS[0];
    renderDetails(payment);
    const method = within(await screen.findByRole('region', { name: 'Payment method' }));
    expect(method.getByText(`•••• ${payment.method.last4}`)).toBeInTheDocument();
    const metadata = within(screen.getByRole('region', { name: 'Metadata' }));
    expect(metadata.getByText(payment.customer.email)).toBeInTheDocument();
    expect(metadata.getByText(payment.customer.name)).toBeInTheDocument();
  });
});

describe('navigation to details', () => {
  function renderList() {
    const user = userEvent.setup();
    render(
      <NuqsTestingAdapter hasMemory>
        <Suspense fallback="Loading">
          <PaymentsView payments={PAYMENTS.slice(0, 5)} />
        </Suspense>
      </NuqsTestingAdapter>,
    );
    return user;
  }

  it('links the payment ID to its details page', async () => {
    renderList();
    const first = PAYMENTS[0];
    expect(await screen.findByRole('link', { name: shortenPaymentId(first.id) })).toHaveAttribute(
      'href',
      `/payments/${first.id}`,
    );
  });

  it('opens the payment when a row is clicked, but not from its controls', async () => {
    const user = renderList();
    const first = PAYMENTS[0];
    const rows = within(await screen.findByRole('table')).getAllByRole('row');
    await user.click(within(rows[1]).getByText(first.customer.email));
    expect(navigation.push).toHaveBeenCalledWith(`/payments/${first.id}`);

    navigation.push.mockReset();
    await user.click(within(rows[1]).getByRole('button', { name: `Copy payment ID ${first.id}` }));
    await user.click(within(rows[1]).getByRole('checkbox'));
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('sends a search typed on a details page back to the list', async () => {
    navigation.pathname = `/payments/${PAYMENTS[0].id}`;
    const user = userEvent.setup();
    render(
      <NuqsTestingAdapter>
        <SearchInput />
      </NuqsTestingAdapter>,
    );
    await user.type(screen.getByRole('searchbox'), '4');
    expect(navigation.push).toHaveBeenCalledWith('/payments?q=4');
  });
});

describe('details edge cases', () => {
  it('shows the refund date in Payment details for refunded payments', async () => {
    renderDetails(refunded);
    const details = within(await screen.findByRole('region', { name: 'Payment details' }));
    expect(details.getByText('Refunded', { selector: 'dt' })).toBeInTheDocument();
  });

  it('does not find unknown ids in the real dataset and renders a not-found page', () => {
    expect(findPayment(PAYMENTS, 'pi_unknown')).toBeUndefined();
    render(<PaymentNotFound />);
    expect(screen.getByRole('heading', { name: 'Payment not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to payments' })).toHaveAttribute(
      'href',
      '/payments',
    );
  });
});

describe('row click guards', () => {
  function renderList() {
    const user = userEvent.setup();
    render(
      <NuqsTestingAdapter hasMemory>
        <Suspense fallback="Loading">
          <PaymentsView payments={PAYMENTS.slice(0, 5)} />
        </Suspense>
      </NuqsTestingAdapter>,
    );
    return user;
  }

  it('ignores modified clicks and clicks in the select cell padding', async () => {
    const user = renderList();
    const rows = within(await screen.findByRole('table')).getAllByRole('row');
    const email = within(rows[1]).getByText(PAYMENTS[0].customer.email);
    await user.keyboard('{Meta>}');
    await user.click(email);
    await user.keyboard('{/Meta}');
    await user.keyboard('{Control>}');
    await user.click(email);
    await user.keyboard('{/Control}');
    await user.click(rows[1].querySelector('td[data-row-click="ignore"]') as HTMLElement);
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('does not navigate while text is selected', async () => {
    renderList();
    const rows = within(await screen.findByRole('table')).getAllByRole('row');
    const email = within(rows[1]).getByText(PAYMENTS[0].customer.email);
    const selection = window.getSelection();
    selection?.selectAllChildren(email);
    // A drag-select ends with a click on the row; user-event would collapse the selection.
    fireEvent.click(email);
    expect(navigation.push).not.toHaveBeenCalled();
    selection?.removeAllRanges();
  });
});

describe('search from a details page', () => {
  it('keeps every keystroke while navigating back to the list', async () => {
    navigation.pathname = `/payments/${PAYMENTS[0].id}`;
    const user = userEvent.setup();
    render(
      <NuqsTestingAdapter>
        <SearchInput />
      </NuqsTestingAdapter>,
    );
    await user.type(screen.getByRole('searchbox'), '42');
    expect(screen.getByRole('searchbox')).toHaveValue('42');
    expect(navigation.push).toHaveBeenLastCalledWith('/payments?q=42');
  });
});
