/**
 * Type-safe message conversion from validated ChatRequest payloads to Vercel AI SDK UIMessage arrays.
 */
import type { UIMessage } from 'ai';
import { sanitizeUserQuery } from '@/lib/agents/promptGuard';

export interface ValidatedChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  parts?: readonly { type: string; text?: string }[];
  content?: string;
}

function collectSafeText(msg: ValidatedChatMessage): string {
  const partChunks = (msg.parts ?? [])
    .filter((p) => p.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text ?? '');
  const combined = partChunks.length > 0 ? partChunks.join(' ') : (msg.content ?? '');
  return msg.role === 'user' ? sanitizeUserQuery(combined) : combined.trim().slice(0, 4000);
}

/** Converts Zod-validated request messages into typed UIMessage objects without unsafe casts. */
export function toSanitizedUiMessages(
  messages: readonly ValidatedChatMessage[],
): Omit<UIMessage, 'id'>[] {
  return messages.map((msg) => ({
    role: msg.role,
    parts: [{ type: 'text', text: collectSafeText(msg) }],
  }));
}
