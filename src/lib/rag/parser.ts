import type { KbCategory, KbDoc, Persona } from '@/lib/types';

const VALID_PERSONAS: ReadonlySet<string> = new Set(['family', 'commuter', 'community']);

function parseFrontmatter(raw: string): { meta: Record<string, string>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };

  const metaBlock = match[1] ?? '';
  const bodyBlock = match[2] ?? raw;
  const meta: Record<string, string> = {};
  for (const line of metaBlock.split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      meta[key] = val;
    }
  }
  return { meta, content: bodyBlock.trim() };
}

function extractSources(content: string): { body: string; sources: string[] } {
  const parts = content.split(/\r?\n##\s+Sources\s*\r?\n/i);
  const body = (parts[0] ?? '').trim();
  const sourcesPart = parts[1];
  if (!sourcesPart) return { body, sources: [] };

  const sources = sourcesPart
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter((line) => line.length > 0);
  return { body, sources };
}

/** Parses a curated knowledge-base markdown file into a structured KbDoc. */
export function parseMarkdownDoc(slug: string, category: KbCategory, raw: string): KbDoc {
  const { meta, content } = parseFrontmatter(raw);
  const { body, sources } = extractSources(content);

  const personas = (meta.personas ?? 'family,commuter,community')
    .split(',')
    .map((p) => p.trim())
    .filter((p): p is Persona => VALID_PERSONAS.has(p));

  const tags = (meta.tags ?? '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  return {
    id: meta.id || slug,
    slug,
    title: meta.title || slug,
    category,
    personas: personas.length > 0 ? personas : ['family', 'commuter', 'community'],
    tags,
    impactMetric: meta.impactMetric || '',
    body,
    sources,
  };
}
