/**
 * Accessible custom 404 page guiding visitors back to live lookup, dashboard, or AI coach.
 */
import Link from 'next/link';
import { Wind } from 'lucide-react';

/** Renders a light-mode 404 navigation card when an unknown route is visited. */
export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto max-w-2xl px-4 py-16">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-2 text-sky-700">
          <Wind className="h-6 w-6" aria-hidden="true" />
          <span className="text-sm font-bold uppercase tracking-wide">404 — Route Not Found</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          This BreatheWise page does not exist
        </h1>
        <p className="mt-3 text-base text-slate-700">
          Return to live city AQI lookup or open your personalized air quality dashboard.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
          >
            City Lookup
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Open Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
