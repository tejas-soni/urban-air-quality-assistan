/**
 * Global footer summarizing WHO/EPA/DEFRA evidence foundations and quick route links.
 */
import Link from 'next/link';

/** Renders accessible footer landmark navigation. */
export function Footer() {
  return (
    <footer className="no-print mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Grounded in WHO 2021 Air Quality Guidelines (15 µg/m³ 24-hr PM2.5), US EPA AQI, and UK
          DEFRA conversion factors.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/dashboard" className="font-medium text-sky-700 hover:underline">
            Daily Routines
          </Link>
          <Link href="/chat" className="font-medium text-sky-700 hover:underline">
            Cited AI Assistant
          </Link>
          <Link href="/community" className="font-medium text-sky-700 hover:underline">
            School &amp; Group Plans
          </Link>
        </div>
      </div>
    </footer>
  );
}
