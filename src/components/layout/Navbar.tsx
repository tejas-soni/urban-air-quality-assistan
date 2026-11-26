'use client';

/**
 * Primary top navigation bar with route indicator and persistent persona switcher.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wind, Users, Car, Home } from 'lucide-react';
import type { Persona } from '@/lib/types';

interface NavbarProps {
  activePersona: Persona;
  onPersonaChange?: (persona: Persona) => void;
}

const NAV_LINKS = [
  { href: '/', label: 'Lookup' },
  { href: '/onboarding', label: 'Setup' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/chat', label: 'AI Chat' },
  { href: '/community', label: 'Community' },
];

const PERSONAS: readonly { id: Persona; label: string; Icon: typeof Home }[] = [
  { id: 'family', label: 'Family', Icon: Home },
  { id: 'commuter', label: 'Commuter', Icon: Car },
  { id: 'community', label: 'Community', Icon: Users },
];

/** Renders primary route links and active Family/Commuter/Community toggle buttons. */
export function Navbar({ activePersona, onPersonaChange }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="no-print border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex min-h-[44px] items-center gap-2 text-lg font-bold text-slate-900 hover:text-sky-700"
        >
          <Wind className="h-6 w-6 text-sky-600" aria-hidden="true" />
          <span>BreatheWise</span>
        </Link>

        <nav aria-label="Primary navigation" className="flex flex-wrap items-center gap-1 sm:gap-2">
          {NAV_LINKS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-[44px] items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-sky-50 text-sky-800 ring-1 ring-sky-200'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div
          role="group"
          aria-label="Active persona switcher"
          className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1"
        >
          {PERSONAS.map(({ id, label, Icon }) => {
            const selected = activePersona === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                onClick={() => onPersonaChange?.(id)}
                className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                  selected
                    ? 'bg-sky-700 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-white hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
