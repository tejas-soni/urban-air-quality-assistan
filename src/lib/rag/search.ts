/**
 * Ranked markdown knowledge-base search formatting excerpts and source citations.
 */
import { scoreDocument, tokenizeQuery } from '@/lib/rag/score';
import type { KbCitation, KbDoc, Persona } from '@/lib/types';

export interface SearchOptions {
  persona?: Persona;
  limit?: number;
}

function extractSnippet(doc: KbDoc): string {
  const firstParagraph = doc.body
    .split(/\r?\n\r?\n/)
    .map((p) => p.replace(/^#+\s*/gm, '').trim())
    .find((p) => p.length > 20);
  return (firstParagraph ?? doc.impactMetric).slice(0, 220);
}

/** Ranks knowledge-base documents by keyword overlap, tags, impact relevance, and persona. */
export function searchDocs(
  docs: readonly KbDoc[],
  query: string,
  options: SearchOptions = {},
): KbCitation[] {
  const tokens = tokenizeQuery(query);
  const limit = Math.max(1, options.limit ?? 4);

  return docs
    .map((doc) => ({ doc, score: scoreDocument(doc, tokens, options.persona) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ doc, score }) => ({
      id: doc.id,
      title: doc.title,
      category: doc.category,
      impactMetric: doc.impactMetric,
      snippet: extractSnippet(doc),
      sources: doc.sources,
      score: Math.round(score * 10) / 10,
    }));
}
