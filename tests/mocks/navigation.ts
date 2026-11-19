import { vi } from 'vitest';

/**
 * State behind the `next/navigation` mock registered in tests/setup.ts. The App
 * Router is not mounted in jsdom; tests set `pathname` and assert on `push`.
 */
export const navigation = {
  pathname: '/payments',
  push: vi.fn<(href: string) => void>(),
};

export function resetNavigation() {
  navigation.pathname = '/payments';
  navigation.push.mockReset();
}
