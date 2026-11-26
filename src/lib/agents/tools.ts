import { tool } from 'ai';
import { z } from 'zod';
import { buildPersonaRoutines } from '@/lib/aqi/routines';
import { fetchCityAqi } from '@/lib/providers/client';
import { searchKnowledgeBase } from '@/lib/rag/loader';
import { PersonaSchema } from '@/lib/schemas';
import { DEFAULT_PROFILE } from '@/lib/storage/profile';
import type { UserProfile } from '@/lib/types';

/** Creates Vercel AI SDK server-side tools bound to live AQI providers and curated RAG docs. */
export function createAirQualityTools(profile: UserProfile = DEFAULT_PROFILE) {
  return {
    get_live_aqi: tool({
      description:
        'Fetch live or 60-minute cached AQI, PM2.5, WHO guideline ratio, 24h forecast, and persona routines for a city.',
      inputSchema: z.object({
        city: z.string().min(2).max(80).describe('Urban city name, e.g. New Delhi or London'),
      }),
      execute: async ({ city }) => {
        const reading = await fetchCityAqi(city);
        const routines = buildPersonaRoutines(reading, { ...profile, city: reading.city });
        return {
          city: reading.city,
          aqi: reading.aqi,
          band: reading.band,
          pm25: reading.pollutants.pm25,
          whoRatio: reading.whoRatio,
          providersUsed: reading.providersUsed,
          cached: reading.cached,
          topRoutines: routines.slice(0, 2),
        };
      },
    }),

    search_knowledge_base: tool({
      description:
        'Retrieve cited WHO/EPA air quality guidance, indoor air hacks, and quantified emission factors from /content.',
      inputSchema: z.object({
        query: z.string().min(2).max(200).describe('Search topic, e.g. afternoon ventilation'),
        persona: PersonaSchema.optional(),
      }),
      execute: async ({ query, persona }) => {
        const hits = searchKnowledgeBase(query, { persona: persona ?? profile.persona, limit: 4 });
        return { citations: hits };
      },
    }),
  };
}
