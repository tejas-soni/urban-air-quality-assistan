/**
 * Streaming AI chat route handler enforcing HTTP admission checks, rate limiting, and fallback.
 */
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { convertToModelMessages, stepCountIs, streamText } from 'ai';
import { createGroundedFallbackResponse } from '@/lib/agents/chatFallbackStream';
import { buildGuardedGeminiResponse } from '@/lib/agents/liveFirewall';
import { toSanitizedUiMessages, type ValidatedChatMessage } from '@/lib/agents/messageNormalize';
import { buildPersonaSystemPrompt, extractLastUserText } from '@/lib/agents/prompts';
import { chatRateLimiter } from '@/lib/agents/rateLimit';
import { createAirQualityTools } from '@/lib/agents/tools';
import { resolveClientIp } from '@/lib/http/clientIp';
import { checkPostAdmission, readJsonBodyCapped } from '@/lib/http/guard';
import { logServerEvent, summarizeError } from '@/lib/logger';
import { fetchCityAqi } from '@/lib/providers/client';
import { searchKnowledgeBase } from '@/lib/rag/loader';
import { ChatRequestSchema } from '@/lib/schemas';
import { DEFAULT_PROFILE } from '@/lib/storage/profile';
import type { UserProfile } from '@/lib/types';

export const maxDuration = 30;

function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

interface StreamParams {
  apiKey: string;
  query: string;
  profile: UserProfile;
  messages: readonly ValidatedChatMessage[];
  signal: AbortSignal;
}

async function streamWithGemini(params: StreamParams): Promise<Response> {
  const { apiKey, query, profile, messages, signal } = params;
  const aqiContext = await fetchCityAqi(profile.city);
  const citations = searchKnowledgeBase(query || profile.persona, {
    persona: profile.persona,
    limit: 4,
  });
  const tools = createAirQualityTools(profile);
  const google = createGoogleGenerativeAI({ apiKey });
  const uiMessages = toSanitizedUiMessages(messages);
  const modelMessages = await convertToModelMessages(uiMessages, { tools });

  const result = streamText({
    model: google('gemini-2.5-flash'),
    instructions: buildPersonaSystemPrompt(profile, aqiContext),
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(4),
    abortSignal: signal,
  });

  return buildGuardedGeminiResponse(
    result,
    { aqi: aqiContext, profile, citations, extraNumbers: [query] },
    { 'X-BreatheWise-Mode': 'gemini-live', 'Cache-Control': 'no-store' },
  );
}

async function parseValidatedRequest(req: Request): Promise<
  | {
      ok: true;
      profile: UserProfile;
      query: string;
      messages: readonly ValidatedChatMessage[];
    }
  | { ok: false; res: Response }
> {
  const admission = checkPostAdmission(req);
  if (!admission.ok) return { ok: false, res: jsonError(admission.error, admission.status) };

  const bodyResult = await readJsonBodyCapped(req);
  if (!bodyResult.ok) return { ok: false, res: jsonError(bodyResult.error, bodyResult.status) };

  const parsed = ChatRequestSchema.safeParse(bodyResult.data);
  if (!parsed.success) return { ok: false, res: jsonError('Invalid chat request payload', 400) };

  return {
    ok: true,
    profile: parsed.data.profile ?? DEFAULT_PROFILE,
    query: extractLastUserText(parsed.data.messages),
    messages: parsed.data.messages,
  };
}

/** Streams persona-tailored air quality guidance with strict admission, firewall, and fallback. */
export async function POST(req: Request): Promise<Response> {
  const validated = await parseValidatedRequest(req);
  if (!validated.ok) return validated.res;

  if (!chatRateLimiter.check(resolveClientIp(req)).allowed) {
    return createGroundedFallbackResponse(
      validated.query,
      validated.profile,
      'rate-limit-fallback',
    );
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return createGroundedFallbackResponse(validated.query, validated.profile, 'local-fallback');
  }

  try {
    return await streamWithGemini({
      apiKey,
      query: validated.query,
      profile: validated.profile,
      messages: validated.messages,
      signal: req.signal,
    });
  } catch (err) {
    logServerEvent('gemini_chat_fallback', { reason: summarizeError(err) });
    return createGroundedFallbackResponse(validated.query, validated.profile, 'local-fallback');
  }
}
