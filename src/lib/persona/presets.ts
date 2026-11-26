/**
 * Shared persona catalog metadata and starter AI prompts decoupled from UI components.
 */
import type { Persona } from '@/lib/types';

export interface PersonaCardSpec {
  id: Persona;
  title: string;
  summary: string;
  impact: string;
}

export const PERSONA_CARD_SPECS: readonly PersonaCardSpec[] = [
  {
    id: 'family',
    title: 'Family Shield',
    summary: 'School-run timing, kids outdoor play windows, and HEPA/DIY clean rooms.',
    impact: 'Ventilate at 2 PM vs 8 AM -> ~40% less indoor PM2.5 intake',
  },
  {
    id: 'commuter',
    title: 'Low-Emission Commuter',
    summary: 'Post-peak timing shifts, transit vs car vs walk CO2e math, and N95 guidance.',
    impact: 'Shift 30+ min later -> ~15% lower exposure + up to 80% less CO2e',
  },
  {
    id: 'community',
    title: 'Community & Schools',
    summary: 'Shareable no-idling school gate pledges and WhatsApp-ready alert cards.',
    impact: 'Idle-free pickup zones -> ~60–80% lower curbside PM2.5 spikes',
  },
];

export const CHAT_SUGGESTIONS_BY_PERSONA: Record<Persona, readonly string[]> = {
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
