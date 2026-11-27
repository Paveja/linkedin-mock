export default function Loading() {
  return (
    <main
      id="main-content"
      role="status"
      aria-label="Loading posts"
      aria-busy="true"
      className="mx-auto w-full max-w-2xl space-y-6 px-4 py-12 motion-safe:animate-pulse"
    >
      <div className="rounded-control bg-muted h-8 w-48" />
      <div className="rounded-container border-border bg-card h-24 border" />
      {[1, 2, 3].map((card) => (
        <div key={card} className="rounded-container border-border bg-card space-y-4 border p-6">
          <div className="flex items-center gap-3">
            <div className="bg-muted size-12 rounded-full" />
            <div className="rounded-control bg-muted h-4 w-32" />
          </div>
          <div className="rounded-control bg-muted h-4 w-full" />
          <div className="rounded-control bg-muted h-4 w-3/4" />
          <div className="rounded-control bg-muted h-12" />
        </div>
      ))}
    </main>
  );
}
