'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Send, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { useUserProfile } from '@/components/layout/useProfile';
import type { Persona } from '@/lib/types';

const PROMPTS_BY_PERSONA: Record<Persona, string[]> = {
  family: [
    'When is the safest 15-minute window to ventilate our home today?',
    'Should I build a DIY Corsi-Rosenthal filter or keep windows closed?',
    'Is outdoor play safe for young kids at current AQI levels?',
  ],
  commuter: [
    'How much PM2.5 exposure do I cut by shifting my commute 30 min later?',
    'Compare daily CO2e emissions for car vs metro vs walking for 10 km.',
    'Should I use car AC recirculation mode in winter traffic?',
  ],
  community: [
    'Draft a school gate no-idling action summary with quantified impact.',
    'How many portable air cleaners does a standard classroom need?',
    'What AQI thresholds should trigger our neighborhood WhatsApp alert?',
  ],
};

interface ChatPanelProps {
  compact?: boolean;
}

export function ChatPanel({ compact = false }: ChatPanelProps) {
  const profile = useUserProfile();
  const [input, setInput] = useState('');

  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), []);
  const { messages, sendMessage, status, error } = useChat({ transport });
  const isBusy = status === 'submitted' || status === 'streaming';
  const suggestions = PROMPTS_BY_PERSONA[profile.persona];

  function handleSend(text: string) {
    const clean = text.trim();
    if (!clean || isBusy) return;
    sendMessage({ text: clean }, { body: { profile } });
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
            disabled={isBusy}
            onClick={() => handleSend(q)}
            className="min-h-[38px] rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-left text-xs font-medium text-sky-900 hover:bg-sky-100 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      <div
        aria-live="polite"
        aria-label="Conversation transcript"
        className={`mt-4 space-y-4 overflow-y-auto rounded-xl bg-slate-50 p-4 ${compact ? 'min-h-[220px] max-h-[340px]' : 'min-h-[320px] max-h-[500px]'}`}
      >
        {messages.length === 0 ? (
          <p className="text-base text-slate-600">
            Ask any question about winter smog, indoor filtration, commute timing, or community
            plans. Every reply checks live AQI and cites verified WHO/EPA sources.
          </p>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        {isBusy && (
          <p className="text-sm font-medium text-sky-700">Checking live AQI &amp; sources...</p>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-900">
          Unable to complete chat request. Please try again.
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask e.g. When should I ventilate today?"
            maxLength={800}
            className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-base text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <button
          type="submit"
          disabled={isBusy || !input.trim()}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-2.5 text-base font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          <span>Ask Assistant</span>
        </button>
      </form>
    </section>
  );
}
