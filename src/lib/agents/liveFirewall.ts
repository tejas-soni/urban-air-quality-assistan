/**
 * Real-time UI stream guard applying the numeric firewall to live Gemini generations.
 */
import { createUIMessageStreamResponse, type UIMessageChunk } from 'ai';
import { buildAllowedNumberSet, verifyReplyGrounding } from '@/lib/agents/numberFirewall';
import type { AqiReading, KbCitation, UserProfile } from '@/lib/types';

export interface GroundingContext {
  aqi: AqiReading;
  profile: UserProfile;
  citations: readonly KbCitation[];
  extraNumbers: readonly string[];
}

interface TextStreamCapable {
  toUIMessageStream?: () => ReadableStream<UIMessageChunk>;
  toUIMessageStreamResponse: (init?: { headers?: Record<string, string> }) => Response;
}

interface StreamState {
  fullText: string;
  activeTextId: string;
}

function processChunk(
  chunk: UIMessageChunk,
  controller: TransformStreamDefaultController<UIMessageChunk>,
  state: StreamState,
  ctx: GroundingContext,
): void {
  if (chunk.type === 'text-start') state.activeTextId = chunk.id;
  if (chunk.type === 'text-delta') state.fullText += chunk.delta;
  if (chunk.type === 'text-end' && state.fullText.length > 0) {
    const allowed = buildAllowedNumberSet(ctx.aqi, ctx.profile, ctx.citations, ctx.extraNumbers);
    const check = verifyReplyGrounding(state.fullText, allowed);
    if (!check.grounded) {
      const note = check.safeText.slice(state.fullText.length);
      controller.enqueue({ type: 'text-delta', id: state.activeTextId, delta: note });
    }
  }
  controller.enqueue(chunk);
}

/** Attaches the numeric grounding firewall to live streamed Gemini UIMessageChunk responses. */
export function buildGuardedGeminiResponse(
  streamResult: TextStreamCapable,
  ctx: GroundingContext,
  headers: Record<string, string>,
): Response {
  if (typeof streamResult.toUIMessageStream !== 'function') {
    return streamResult.toUIMessageStreamResponse({ headers });
  }
  const state: StreamState = { fullText: '', activeTextId: 'live-txt-1' };
  const transform = new TransformStream<UIMessageChunk, UIMessageChunk>({
    transform: (chunk, controller) => processChunk(chunk, controller, state, ctx),
  });
  return createUIMessageStreamResponse({
    stream: streamResult.toUIMessageStream().pipeThrough(transform),
    headers,
  });
}
