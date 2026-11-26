/**
 * Linear-time markdown parser extracting frontmatter metadata and ## Sources citations safely.
 */
import type { KbCategory, KbDoc, Persona } from '@/lib/types';

const VALID_PERSONAS: ReadonlySet<string> = new Set(['family', 'commuter', 'community']);
const FALLBACK_PERSONAS: Persona[] = ['family', 'commuter', 'community'];

function parseMetaLines(lines: readonly string[]): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return meta;
}

function splitFrontmatter(raw: string): { meta: Record<string, string>; content: string } {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  if (lines[0]?.trim() !== '---') return { meta: {}, content: raw.trim() };
  const closeIdx = lines.findIndex((line, idx) => idx > 0 && line.trim() === '---');
  if (closeIdx === -1) return { meta: {}, content: raw.trim() };
  return {
    meta: parseMetaLines(lines.slice(1, closeIdx)),
    content: lines
      .slice(closeIdx + 1)
      .join('\n')
      .trim(),
  };
}

function splitSourcesSection(content: string): { body: string; sources: string[] } {
  const lines = content.split('\n');
  const headingIdx = lines.findIndex((line) => /^##\s+sources\s*$/i.test(line.trim()));
  if (headingIdx === -1) return { body: content.trim(), sources: [] };
  const sources = lines
    .slice(headingIdx + 1)
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
  return { body: lines.slice(0, headingIdx).join('\n').trim(), sources };
}

function parsePersonas(rawPersonas?: string): Persona[] {
  const parsed = (rawPersonas ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter((p): p is Persona => VALID_PERSONAS.has(p));
  return parsed.length > 0 ? parsed : FALLBACK_PERSONAS;
}

function nonEmpty(value: string | undefined, fallback: string): string {
  return value && value.length > 0 ? value : fallback;
}

/** Parses a curated knowledge-base markdown file into a structured KbDoc in O(n) linear time. */
export function parseMarkdownDoc(slug: string, category: KbCategory, raw: string): KbDoc {
  const { meta, content } = splitFrontmatter(raw);
  const { body, sources } = splitSourcesSection(content);
  const tags = (meta.tags ?? '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  return {
    id: nonEmpty(meta.id, slug),
    slug,
    title: nonEmpty(meta.title, slug),
    category,
    personas: parsePersonas(meta.personas),
    tags,
    impactMetric: meta.impactMetric ?? '',
    body,
    sources,
  };
}
