/**
 * Deterministic UIMessage stream generator for rate-limited or offline RAG fallback replies.
 */
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessageChunk,
  type UIMessageStreamWriter,
} from 'ai';
import { buildFallbackAnswer } from '@/lib/agents/fallback';
import { buildAllowedNumberSet, verifyReplyGrounding } from '@/lib/agents/numberFirewall';
import { TtlCache } from '@/lib/providers/cache';
import { fetchCityAqi } from '@/lib/providers/client';
import { hashPayload } from '@/lib/providers/hash';
import { searchKnowledgeBase } from '@/lib/rag/loader';
import type { AqiReading, KbCitation, UserProfile } from '@/lib/types';

export const fallbackReplyCache = new TtlCache<string>(10 * 60 * 1000, () => Date.now(), 100);

function emitToolEvents(
  writer: UIMessageStreamWriter,
  opts: {
    aqi: AqiReading;
    query: string;
    profile: UserProfile;
    citations: readonly KbCitation[];
  },
): void {
  const { aqi, query, profile, citations } = opts;
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
}

function resolveCachedReply(
  query: string,
  profile: UserProfile,
  aqi: AqiReading,
  citations: readonly KbCitation[],
): { text: string; cacheStatus: 'HIT' | 'MISS' } {
  const cacheKey = hashPayload({ query, persona: profile.persona, city: aqi.city, aqi: aqi.aqi });
  const hit = fallbackReplyCache.get(cacheKey);
  if (hit) return { text: hit, cacheStatus: 'HIT' };

  const raw = buildFallbackAnswer(query, profile, aqi, citations);
  const allowed = buildAllowedNumberSet(aqi, profile, citations, [raw]);
  const safeBase = verifyReplyGrounding(raw, allowed).safeText;
  fallbackReplyCache.set(cacheKey, safeBase);
  return { text: safeBase, cacheStatus: 'MISS' };
}

/** Builds and streams a deterministic, number-verified local RAG response. */
export async function createGroundedFallbackResponse(
  query: string,
  profile: UserProfile,
  mode: 'local-fallback' | 'rate-limit-fallback',
): Promise<Response> {
  const aqi = await fetchCityAqi(profile.city);
  const citations = searchKnowledgeBase(query || profile.persona, {
    persona: profile.persona,
    limit: 4,
  });
  const { text, cacheStatus } = resolveCachedReply(query, profile, aqi, citations);
  const notice =
    mode === 'rate-limit-fallback'
      ? '> Note: Free-tier AI rate limit reached; serving grounded local RAG analysis.\n\n'
      : '';
  const textId = `txt-${Date.now()}`;

  const stream: ReadableStream<UIMessageChunk> = createUIMessageStream({
    execute: ({ writer }) => {
      emitToolEvents(writer, { aqi, query, profile, citations });
      writer.write({ type: 'text-start', id: textId });
      writer.write({ type: 'text-delta', id: textId, delta: `${notice}${text}` });
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
