import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { createGroundedFallbackResponse } from '@/lib/agents/chatFallbackStream';
import { buildPersonaSystemPrompt, extractLastUserText } from '@/lib/agents/prompts';
import { chatRateLimiter } from '@/lib/agents/rateLimit';
import { createAirQualityTools } from '@/lib/agents/tools';
import { checkPostAdmission, readJsonBodyCapped } from '@/lib/http/guard';
import { fetchCityAqi } from '@/lib/providers/client';
import { ChatRequestSchema } from '@/lib/schemas';
import { DEFAULT_PROFILE } from '@/lib/storage/profile';
import type { UserProfile } from '@/lib/types';

export const maxDuration = 30;

function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  const first = fwd ? fwd.split(',')[0] : undefined;
  return first ? first.trim() : 'local';
}

async function streamWithGemini(
  apiKey: string,
  profile: UserProfile,
  messages: unknown[],
  signal: AbortSignal,
): Promise<Response> {
  const aqiContext = await fetchCityAqi(profile.city);
  const tools = createAirQualityTools(profile);
  const google = createGoogleGenerativeAI({ apiKey });
  const modelMessages = await convertToModelMessages(messages as unknown as UIMessage[], { tools });
  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: buildPersonaSystemPrompt(profile, aqiContext),
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(4),
    abortSignal: signal,
  });
  return result.toUIMessageStreamResponse({
    headers: { 'X-BreatheWise-Mode': 'gemini-live', 'Cache-Control': 'no-store' },
  });
}

async function parseValidatedRequest(
  req: Request,
): Promise<
  | { ok: true; profile: UserProfile; query: string; messages: unknown[] }
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

/** Streams persona-tailored air quality guidance with strict request admission and fallback. */
export async function POST(req: Request): Promise<Response> {
  const validated = await parseValidatedRequest(req);
  if (!validated.ok) return validated.res;

  if (!chatRateLimiter.check(clientIp(req)).allowed) {
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
    return await streamWithGemini(apiKey, validated.profile, validated.messages, req.signal);
  } catch {
    return createGroundedFallbackResponse(validated.query, validated.profile, 'local-fallback');
  }
}
