/**
 * Cache-backed public GET /api/aqi endpoint validating city queries via CityQuerySchema.
 */
import { fetchCityAqi } from '@/lib/providers/client';
import { CityQuerySchema } from '@/lib/schemas';

/** Returns live or 60-minute cached AQI telemetry and forecasts for a requested urban city. */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const rawCity = searchParams.get('city') ?? 'New Delhi';
  const parsed = CityQuerySchema.safeParse({ city: rawCity });

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid city parameter' },
      { status: 400 },
    );
  }

  const reading = await fetchCityAqi(parsed.data.city);
  return Response.json(reading, {
    status: 200,
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  });
}
