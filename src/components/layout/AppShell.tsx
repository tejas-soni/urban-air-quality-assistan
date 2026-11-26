'use client';

import type { ReactNode } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { switchAppPersona, useUserProfile } from '@/components/layout/useProfile';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const profile = useUserProfile();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar activePersona={profile.persona} onPersonaChange={switchAppPersona} />
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
