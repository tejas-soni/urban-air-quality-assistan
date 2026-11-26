import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseMarkdownDoc } from '@/lib/rag/parser';
import { searchDocs, type SearchOptions } from '@/lib/rag/search';
import type { KbCategory, KbCitation, KbDoc } from '@/lib/types';

const CATEGORIES: ReadonlyArray<KbCategory> = ['health-guidance', 'indoor-hacks', 'impact-data'];

let cachedDocs: KbDoc[] | null = null;

/** Loads all curated markdown knowledge-base docs from /content (cached in memory). */
export function loadKnowledgeBase(contentRoot?: string): KbDoc[] {
  const defaultRoot = join(/*turbopackIgnore: true*/ process.cwd(), 'content');
  const root = contentRoot ?? defaultRoot;
  if (cachedDocs && root === defaultRoot) {
    return cachedDocs;
  }

  const docs: KbDoc[] = [];
  for (const category of CATEGORIES) {
    const dir = join(/*turbopackIgnore: true*/ root, category);
    const files = readdirSync(/*turbopackIgnore: true*/ dir)
      .filter((f) => f.endsWith('.md'))
      .sort();
    for (const file of files) {
      const filePath = join(/*turbopackIgnore: true*/ dir, file);
      const raw = readFileSync(/*turbopackIgnore: true*/ filePath, 'utf8');
      docs.push(parseMarkdownDoc(file.replace(/\.md$/, ''), category, raw));
    }
  }

  if (root === defaultRoot) {
    cachedDocs = docs;
  }
  return docs;
}

/** Searches the curated markdown knowledge base and returns ranked source citations. */
export function searchKnowledgeBase(query: string, options: SearchOptions = {}): KbCitation[] {
  return searchDocs(loadKnowledgeBase(), query, options);
}
