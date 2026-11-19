import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PageHeader } from '@/components/layout/page-header';

describe('PageHeader', () => {
  it('marks Payments as the current section', () => {
    render(<PageHeader />);
    const nav = screen.getByRole('navigation', { name: 'Transactions' });
    expect(screen.getByRole('link', { name: 'Payments' })).toHaveAttribute('aria-current', 'page');
    expect(nav).toHaveTextContent('PaymentsPayoutsTop-upsCollected feesTransfersAll activity');
  });

  it('exposes inert actions as disabled with an explanation', () => {
    render(<PageHeader />);
    for (const name of ['Create payment', 'Analyze', 'Get started']) {
      const button = screen.getByRole('button', { name });
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('title', 'Not available in this demo');
    }
  });

  it('dismisses the banner and keeps focus in place', async () => {
    const user = userEvent.setup();
    render(<PageHeader />);
    await user.click(screen.getByRole('button', { name: 'Dismiss announcement' }));
    expect(screen.queryByRole('region', { name: 'Announcement' })).toBeNull();
    expect(document.querySelector('.announcement-banner-anchor')).toHaveFocus();
  });
});
