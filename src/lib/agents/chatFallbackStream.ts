import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { buildFallbackAnswer } from '@/lib/agents/fallback';
import { verifyReplyGrounding, buildAllowedNumberSet } from '@/lib/agents/numberFirewall';
import { fetchCityAqi } from '@/lib/providers/client';
import { TtlCache } from '@/lib/providers/cache';
import { hashPayload } from '@/lib/providers/hash';
import { searchKnowledgeBase } from '@/lib/rag/loader';
import type { UserProfile } from '@/lib/types';

export const fallbackReplyCache = new TtlCache<string>(10 * 60 * 1000, () => Date.now(), 100);

/** Builds and streams a deterministic, number-verified local RAG response. */
export async function createGroundedFallbackResponse(
  query: string,
  profile: UserProfile,
  mode: 'local-fallback' | 'rate-limit-fallback',
): Promise<Response> {
  const aqi = await fetchCityAqi(profile.city);
  const cacheKey = hashPayload({ query, persona: profile.persona, city: aqi.city, aqi: aqi.aqi });
  const citations = searchKnowledgeBase(query || profile.persona, {
    persona: profile.persona,
    limit: 4,
  });

  let safeBase = fallbackReplyCache.get(cacheKey);
  let cacheStatus: 'HIT' | 'MISS' = 'HIT';

  if (!safeBase) {
    cacheStatus = 'MISS';
    const raw = buildFallbackAnswer(query, profile, aqi, citations);
    const allowed = buildAllowedNumberSet(aqi, profile, citations, [raw]);
    safeBase = verifyReplyGrounding(raw, allowed).safeText;
    fallbackReplyCache.set(cacheKey, safeBase);
  }

  const notice =
    mode === 'rate-limit-fallback'
      ? '> Note: Free-tier AI rate limit reached; serving grounded local RAG analysis.\n\n'
      : '';
  const fullText = `${notice}${safeBase}`;
  const textId = `txt-${Date.now()}`;

  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({
        type: 'tool-input-available',
        toolCallId: 'aqi-lookup-1',
        toolName: 'get_live_aqi',
        input: { city: profile.city },
      });
      writer.write({
        type: 'tool-output-available',
        toolCallId: 'aqi-lookup-1',
        output: {
          city: aqi.city,
          aqi: aqi.aqi,
          pm25: aqi.pollutants.pm25,
          providers: aqi.providersUsed,
        },
      });
      writer.write({
        type: 'tool-input-available',
        toolCallId: 'kb-lookup-1',
        toolName: 'search_knowledge_base',
        input: { query: query || profile.persona, persona: profile.persona },
      });
      writer.write({
        type: 'tool-output-available',
        toolCallId: 'kb-lookup-1',
        output: { citations: citations.map((c) => c.id) },
      });
      writer.write({ type: 'text-start', id: textId });
      writer.write({ type: 'text-delta', id: textId, delta: fullText });
      writer.write({ type: 'text-end', id: textId });
    },
  });

  return createUIMessageStreamResponse({
    stream,
    headers: {
      'X-BreatheWise-Mode': mode,
      'X-BreatheWise-Cache': cacheStatus,
      'Cache-Control': 'no-store',
    },
  });
}
