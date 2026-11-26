'use client';

/**
 * Root App Router global error boundary catching root layout exceptions gracefully.
 */
interface GlobalErrorProps {
  reset: () => void;
}

/** Fallback HTML shell rendered only when the root layout itself fails. */
export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 p-8 text-slate-900">
        <main className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Application Recovery</h1>
          <p className="mt-2 text-base text-slate-700">
            An unexpected layout error interrupted rendering. Reload to restore BreatheWise.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 min-h-[44px] rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
          >
            Reload App
          </button>
        </main>
      </body>
    </html>
  );
}
