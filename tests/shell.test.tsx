import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, it } from 'vitest';
import { MOCK_ACCOUNT } from '@/components/layout/account-menu';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { UNAVAILABLE_HINT_ID } from '@/components/layout/unavailable';
import PaymentsLayout from '../app/payments/layout';

describe('Sidebar', () => {
  it('lists the reference sections and marks Transactions as current', () => {
    render(<Sidebar />);
    const nav = within(screen.getByRole('navigation', { name: 'Main' }));
    expect(nav.getByRole('link', { name: 'Transactions' })).toHaveAttribute('aria-current', 'page');
    for (const name of [
      'Home',
      'Balances',
      'Customers',
      'Product catalog',
      'Payments',
      'Developers',
    ]) {
      const link = nav.getByRole('link', { name });
      expect(link).toHaveAttribute('aria-disabled', 'true');
      expect(link).toHaveAttribute('tabindex', '0');
      expect(link).toHaveAttribute('aria-describedby', UNAVAILABLE_HINT_ID);
    }
    expect(nav.getByRole('list', { name: 'Shortcuts' })).toBeInTheDocument();
    expect(nav.getByRole('list', { name: 'Products' })).toBeInTheDocument();
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('opens the account menu from the keyboard', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    const trigger = screen.getByRole('button', { name: `Account menu for ${MOCK_ACCOUNT.name}` });
    trigger.focus();
    await user.keyboard('{Enter}');

    const menu = await screen.findByRole('menu');
    expect(within(menu).getByText(MOCK_ACCOUNT.email)).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Sign out' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });
});

describe('TopBar', () => {
  it('has a labelled search box and labelled icon buttons', () => {
    render(
      <NuqsTestingAdapter>
        <TopBar />
      </NuqsTestingAdapter>,
    );
    expect(
      within(screen.getByRole('search')).getByRole('searchbox', { name: /Search payments/ }),
    ).toBeInTheDocument();
    for (const name of ['Help', 'Notifications, 1 unread', 'Settings', 'Create', 'Apps']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true');
    }
  });
});

describe('PaymentsLayout', () => {
  it('provides a skip link, one banner, the main nav and a focusable main', async () => {
    const user = userEvent.setup();
    render(
      <NuqsTestingAdapter>
        <PaymentsLayout>
          <p>Page</p>
        </PaymentsLayout>
      </NuqsTestingAdapter>,
    );
    await user.tab();
    const skip = screen.getByRole('link', { name: 'Skip to content' });
    expect(skip).toHaveFocus();
    expect(skip).toHaveAttribute('href', '#content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'content');
    expect(screen.getAllByRole('banner')).toHaveLength(1);
    expect(screen.getAllByRole('navigation', { name: 'Main' })).toHaveLength(1);
    expect(document.getElementById(UNAVAILABLE_HINT_ID)).toHaveTextContent(
      'Not available in this demo',
    );
  });
});
