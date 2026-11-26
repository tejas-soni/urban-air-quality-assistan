import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai';
import { buildFallbackAnswer } from '@/lib/agents/fallback';
import { buildPersonaSystemPrompt, extractLastUserText } from '@/lib/agents/prompts';
import { chatRateLimiter } from '@/lib/agents/rateLimit';
import { createAirQualityTools } from '@/lib/agents/tools';
import { fetchCityAqi } from '@/lib/providers/client';
import { searchKnowledgeBase } from '@/lib/rag/loader';
import { ChatRequestSchema } from '@/lib/schemas';
import { DEFAULT_PROFILE } from '@/lib/storage/profile';
import type { UserProfile } from '@/lib/types';

export const maxDuration = 30;

async function createGroundedFallbackResponse(
  query: string,
  profile: UserProfile,
  mode: 'local-fallback' | 'rate-limit-fallback',
): Promise<Response> {
  const aqi = await fetchCityAqi(profile.city);
  const citations = searchKnowledgeBase(query || profile.persona, {
    persona: profile.persona,
    limit: 4,
  });
  const baseText = buildFallbackAnswer(query, profile, aqi, citations);
  const notice =
    mode === 'rate-limit-fallback'
      ? '> Note: Free-tier AI rate limit reached; serving grounded local RAG analysis.\n\n'
      : '';
  const fullText = `${notice}${baseText}`;
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
        output: { city: aqi.city, aqi: aqi.aqi, pm25: aqi.pollutants.pm25, providers: aqi.providersUsed },
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
    headers: { 'X-BreatheWise-Mode': mode },
  });
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 });
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid chat request payload' }, { status: 400 });
  }

  const profile = parsed.data.profile ?? DEFAULT_PROFILE;
  const query = extractLastUserText(parsed.data.messages);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const rate = chatRateLimiter.check(ip);

  if (!rate.allowed) {
    return createGroundedFallbackResponse(query, profile, 'rate-limit-fallback');
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return createGroundedFallbackResponse(query, profile, 'local-fallback');
  }

  try {
    const aqiContext = await fetchCityAqi(profile.city);
    const tools = createAirQualityTools(profile);
    const google = createGoogleGenerativeAI({ apiKey });
    const uiMessages = parsed.data.messages as unknown as UIMessage[];
    const modelMessages = await convertToModelMessages(uiMessages, { tools });

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: buildPersonaSystemPrompt(profile, aqiContext),
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(4),
      abortSignal: req.signal,
    });

    return result.toUIMessageStreamResponse({
      headers: { 'X-BreatheWise-Mode': 'gemini-live' },
    });
  } catch {
    return createGroundedFallbackResponse(query, profile, 'local-fallback');
  }
}
