import { ChatPanel } from '@/components/chat/ChatPanel';
import { AppShell } from '@/components/layout/AppShell';

export default function ChatPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Streaming Air Quality Assistant</h1>
          <p className="mt-2 text-base text-slate-700">
            Powered by live AQI tools and our 48-document WHO/EPA knowledge base. Every tip ends
            with quantified impact and cited sources.
          </p>
        </div>
        <ChatPanel />
      </div>
    </AppShell>
  );
}
