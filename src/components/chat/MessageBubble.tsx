/**
 * Accessible chat bubble displaying user prompts, AI SDK text parts, and verified tool invocations.
 */
import type { UIMessage } from 'ai';
import { Wrench } from 'lucide-react';

interface MessageBubbleProps {
  message: UIMessage;
}

/** Renders one user or assistant UIMessage with tool execution provenance badges. */
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
        {isUser ? 'You' : 'BreatheWise Assistant'}
      </span>

      <div
        className={`max-w-[90%] space-y-2 rounded-2xl px-4 py-3 text-base shadow-sm sm:max-w-[82%] ${
          isUser ? 'bg-sky-700 text-white' : 'border border-slate-200 bg-white text-slate-900'
        }`}
      >
        {message.parts.map((part, idx) => {
          if (part.type === 'text') {
            return (
              <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                {part.text}
              </div>
            );
          }

          if (part.type.startsWith('tool-')) {
            const toolName = part.type.replace(/^tool-/, '');
            return (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-900"
              >
                <Wrench className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Verified source tool: {toolName}</span>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
