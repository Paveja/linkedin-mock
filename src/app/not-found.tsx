import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto max-w-xl space-y-4 px-6 py-16 text-center">
      <h1 className="font-heading text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground text-base">
        This page doesn’t exist. Your shared feed is one click away.
      </p>
      <Link
        href="/"
        className="bg-primary text-primary-foreground focus-visible:outline-ring inline-flex min-h-12 items-center rounded-full px-6 text-sm font-semibold hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        Back to feed
      </Link>
    </main>
  );
}
