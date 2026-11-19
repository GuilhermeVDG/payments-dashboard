import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { resetNavigation } from './mocks/navigation';

afterEach(() => {
  cleanup();
});

// jsdom lacks a few browser APIs Radix primitives rely on.
if (typeof window !== 'undefined') {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver ??= ResizeObserverStub;
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
}

// The App Router is not mounted in jsdom; route hooks read from tests/mocks/navigation.ts.
vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>();
  const { navigation } = await import('./mocks/navigation');
  return {
    ...actual,
    usePathname: () => navigation.pathname,
    useRouter: () => ({
      push: navigation.push,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
  };
});

afterEach(() => {
  resetNavigation();
});
