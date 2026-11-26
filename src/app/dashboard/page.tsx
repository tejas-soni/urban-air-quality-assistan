/**
 * Personalized dashboard route loading initial AQI data for interactive routines and calculators.
 */
import { DashboardView } from '@/components/aqi/DashboardView';
import { AppShell } from '@/components/layout/AppShell';
import { fetchCityAqi } from '@/lib/providers/client';

export const dynamic = 'force-dynamic';

/** Server component hydrating the persona-tailored air quality dashboard. */
export default async function DashboardPage() {
  const initialReading = await fetchCityAqi('New Delhi');

  return (
    <AppShell>
      <DashboardView initialReading={initialReading} />
    </AppShell>
  );
}
