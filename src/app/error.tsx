"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-28 text-center">
      <div className="text-6xl">🫠</div>
      <h1 className="mt-6 font-display text-3xl">Something melted</h1>
      <p className="mt-2 text-sm text-muted">{error.message || "An unexpected error occurred."}</p>
      <button onClick={reset} className="btn btn-primary mt-6 px-6 py-3">Try again</button>
    </div>
  );
}
