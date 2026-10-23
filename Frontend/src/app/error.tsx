"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-muted px-6 py-20 text-center">
      <h1 className="text-2xl font-bold text-stone-900">Something went wrong</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm text-stone-600">
        {error.message || "The application ran into a problem while loading data."}
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-stone-400">Error code: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
      >
        Try again
      </button>
    </main>
  );
}
