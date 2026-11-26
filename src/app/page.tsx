import { LandingView } from '@/components/aqi/LandingView';
import { AppShell } from '@/components/layout/AppShell';
import { fetchCityAqi } from '@/lib/providers/client';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const initialReading = await fetchCityAqi('New Delhi');

  return (
    <AppShell>
      <LandingView initialReading={initialReading} />
    </AppShell>
  );
}
