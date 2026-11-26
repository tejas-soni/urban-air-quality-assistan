import { DashboardView } from '@/components/aqi/DashboardView';
import { AppShell } from '@/components/layout/AppShell';
import { fetchCityAqi } from '@/lib/providers/client';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const initialReading = await fetchCityAqi('New Delhi');

  return (
    <AppShell>
      <DashboardView initialReading={initialReading} />
    </AppShell>
  );
}
