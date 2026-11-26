'use client';

/**
 * Segment-level React Error Boundary providing accessible recovery navigation.
 */
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Renders a calm light-mode recovery card if an App Router route encounters an exception. */
export default function RouteError({ reset }: ErrorBoundaryProps) {
  return (
    <main id="main-content" className="mx-auto max-w-2xl px-4 py-16">
      <section
        role="alert"
        aria-labelledby="error-heading"
        className="rounded-2xl border border-rose-200 bg-white p-8 shadow-sm"
      >
        <div className="flex items-center gap-3 text-rose-800">
          <AlertTriangle className="h-6 w-6 shrink-0" aria-hidden="true" />
          <h1 id="error-heading" className="text-2xl font-bold text-slate-900">
            Something went wrong loading air quality tools
          </h1>
        </div>
        <p className="mt-3 text-base text-slate-700">
          Live sensors or page state hit an unexpected error. Your saved profile in this browser is
          intact.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Return Home
          </Link>
        </div>
      </section>
    </main>
  );
}
