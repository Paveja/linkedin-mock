'use client';

import { Button } from '@/components/button';

export default function ErrorPage({ reset, retry }: { reset?: () => void; retry?: () => void }) {
  return (
    <main id="main-content" className="mx-auto max-w-xl space-y-4 px-6 py-16 text-center">
      <h1 className="font-heading text-2xl font-semibold">We couldn’t load the feed</h1>
      <p role="alert" className="text-muted-foreground text-base">
        Try again in a moment. If the problem continues, check the server connection.
      </p>
      <Button variant="primary" onClick={() => (retry ?? reset)?.()}>
        Try again
      </Button>
    </main>
  );
}
