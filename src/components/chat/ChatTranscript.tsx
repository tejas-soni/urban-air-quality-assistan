/**
 * Accessible live-region chat transcript view rendering AI messages and busy indicator.
 */
import type { UIMessage } from 'ai';
import { MessageBubble } from '@/components/chat/MessageBubble';

interface ChatTranscriptProps {
  messages: readonly UIMessage[];
  isBusy: boolean;
  compact: boolean;
}

/** Renders the scrollable message log inside an aria-live polite transcript region. */
export function ChatTranscript({ messages, isBusy, compact }: ChatTranscriptProps) {
  const heightClass = compact ? 'min-h-[220px] max-h-[340px]' : 'min-h-[320px] max-h-[500px]';

  return (
    <div
      aria-live="polite"
      aria-label="Conversation transcript"
      className={`mt-4 space-y-4 overflow-y-auto rounded-xl bg-slate-50 p-4 ${heightClass}`}
    >
      {messages.length === 0 ? (
        <p className="text-base text-slate-600">
          Ask any question about winter smog, indoor filtration, commute timing, or community plans.
          Every reply checks live AQI and cites verified WHO/EPA sources.
        </p>
      ) : (
        messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
      )}
      {isBusy && (
        <p className="text-sm font-medium text-sky-700">Checking live AQI &amp; sources...</p>
      )}
    </div>
  );
}
