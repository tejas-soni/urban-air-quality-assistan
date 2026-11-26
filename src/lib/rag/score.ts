import type { KbDoc, Persona } from '@/lib/types';

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'what',
  'when',
  'should',
  'from',
  'into',
  'how',
  'can',
  'are',
  'you',
  'at',
  'in',
  'on',
  'to',
  'of',
  'is',
  'it',
  'my',
  'we',
  'do',
  'be',
  'or',
  'by',
]);

export function tokenizeQuery(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9.\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function scoreToken(doc: KbDoc, tok: string): number {
  let pts = 0;
  if (doc.title.toLowerCase().includes(tok)) pts += 4;
  if (doc.tags.some((tag) => tag.includes(tok))) pts += 3;
  if (doc.impactMetric.toLowerCase().includes(tok)) pts += 2.5;
  if (doc.body.toLowerCase().includes(tok)) pts += 1.5;
  return pts;
}

export function scoreDocument(doc: KbDoc, tokens: string[], persona?: Persona): number {
  const personaHit = Boolean(persona && doc.personas.includes(persona));
  if (tokens.length === 0) return personaHit ? 2 : 1;

  const total = tokens.reduce((acc, tok) => acc + scoreToken(doc, tok), 0);
  if (total === 0) return 0;
  return personaHit ? total + 2 : total;
}
