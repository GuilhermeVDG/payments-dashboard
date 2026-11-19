import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-start justify-center gap-3 px-6">
      <p className="text-sm font-semibold tracking-wide text-fg-muted uppercase">404</p>
      <h1 className="text-title font-bold text-fg-strong">Page not found</h1>
      <p className="text-md text-fg-muted">This demo only has the Payments screen.</p>
      <Link href="/payments" className="text-md font-semibold text-link hover:text-brand-hover">
        Go to payments
      </Link>
    </main>
  );
}
