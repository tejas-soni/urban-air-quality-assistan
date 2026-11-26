'use client';

/**
 * Streaming AI Air Quality Coach panel powered by Vercel AI SDK and persona prompt suggestions.
 */
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Send, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ChatTranscript } from '@/components/chat/ChatTranscript';
import { useUserProfile } from '@/components/layout/useProfile';
import { CHAT_SUGGESTIONS_BY_PERSONA } from '@/lib/persona/presets';

interface ChatPanelProps {
  compact?: boolean;
}

function ChatQuestionForm(props: {
  input: string;
  isBusy: boolean;
  onChange: (val: string) => void;
  onSend: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        props.onSend();
      }}
      className="mt-4 flex flex-col gap-2 sm:flex-row"
    >
      <div className="flex-1">
        <label htmlFor="chat-question-input" className="sr-only">
          Ask BreatheWise about air quality or low-emission routines
        </label>
        <input
          id="chat-question-input"
          type="text"
          value={props.input}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder="Ask e.g. When should I ventilate today?"
          maxLength={800}
          className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-base text-slate-900 placeholder:text-slate-400"
        />
      </div>
      <button
        type="submit"
        disabled={props.isBusy || !props.input.trim()}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-2.5 text-base font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        <span>Ask Assistant</span>
      </button>
    </form>
  );
}

/** Renders starter persona questions, live chat transcript, error state, and submission form. */
export function ChatPanel({ compact = false }: ChatPanelProps) {
  const profile = useUserProfile();
  const [input, setInput] = useState('');

  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), []);
  const { messages, sendMessage, status, error } = useChat({ transport });
  const isBusy = status === 'submitted' || status === 'streaming';
  const suggestions = CHAT_SUGGESTIONS_BY_PERSONA[profile.persona];

  function handleSend(text: string) {
    const clean = text.trim();
    if (!clean || isBusy) return;
    void sendMessage({ text: clean }, { body: { profile } });
    setInput('');
  }

  return (
    <section
      aria-labelledby="ai-chat-heading"
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-sky-600" aria-hidden="true" />
          <h2 id="ai-chat-heading" className="text-xl font-bold text-slate-900">
            AI Air Quality Coach ({profile.persona})
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          City: {profile.city} · Grounded in /content KB
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2" aria-label="Suggested questions">
        {suggestions.map((q) => (
          <button
            key={q}
            type="button"
            aria-disabled={isBusy}
            onClick={() => handleSend(q)}
            className="min-h-[44px] rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-left text-xs font-medium text-sky-900 hover:bg-sky-100 aria-disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      <ChatTranscript messages={messages} isBusy={isBusy} compact={compact} />

      {error && (
        <p role="alert" className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-900">
          Unable to complete chat request. Please try again.
        </p>
      )}

      <ChatQuestionForm
        input={input}
        isBusy={isBusy}
        onChange={setInput}
        onSend={() => handleSend(input)}
      />
    </section>
  );
}
