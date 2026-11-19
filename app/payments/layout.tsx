import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { UnavailableHint } from '@/components/layout/unavailable';

/** Dashboard shell: sidebar, top bar and the scrolling content column. */
export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell flex min-h-screen">
      <a
        href="#content"
        className="sr-only z-50 rounded-md bg-surface px-3 py-2 text-md font-semibold text-link shadow-popover focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <UnavailableHint />
      <Sidebar />
      <div className="app-shell__main min-w-0 flex-1 px-[var(--content-gutter)]">
        <TopBar />
        <main id="content" tabIndex={-1} className="app-shell__content pb-10 outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
