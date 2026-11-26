/**
 * Onboarding setup route allowing households and commuters to configure local-first defaults.
 */
import { AppShell } from '@/components/layout/AppShell';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';

/** Renders the accessible onboarding form wrapped in AppShell. */
export default function OnboardingPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-slate-900">Personalize Your Air Quality Plan</h1>
          <p className="mt-2 text-base text-slate-700">
            Select your persona and household context. Preferences stay locally in your browser.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </AppShell>
  );
}
