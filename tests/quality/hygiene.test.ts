import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.next', 'coverage'].includes(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkTsFiles(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full.replace(/\\/g, '/'));
  }
  return out;
}

const REQUIRED_DOCS = [
  'README.md',
  'PROBLEM_ALIGNMENT.md',
  'CODE_QUALITY.md',
  'SECURITY.md',
  'EFFICIENCY.md',
  'TESTING.md',
  'ACCESSIBILITY.md',
  'metadata.json',
  'docs/DECISIONS.md',
  '.env.example',
  '.editorconfig',
  '.github/workflows/ci.yml',
  'public/llms.txt',
  'public/robots.txt',
  'public/sitemap.xml',
  'public/.well-known/ard.json',
];

describe('repository hygiene and architectural invariants', () => {
  const sourceFiles = walkTsFiles('src').filter(
    (f) => !f.includes('.test.') && !f.endsWith('.d.ts'),
  );

  it('ships all required rubric documentation, agent discovery, and CI configs', () => {
    for (const file of REQUIRED_DOCS) {
      expect(existsSync(file), `missing ${file}`).toBe(true);
    }
  });

  it('keeps every source file modular (<= 200 lines)', () => {
    for (const file of sourceFiles) {
      const lines = readFileSync(file, 'utf8').split('\n').length;
      expect(lines, file).toBeLessThanOrEqual(200);
    }
  });

  it('contains no unsafe patterns, client secrets, or internal toolkit references', () => {
    const leakPattern = /AIza[0-9A-Za-z_-]{20,}|hackathon-prep/i;
    const dangerPattern = /dangerouslySetInnerHTML|\beval\(|new Function\(|@ts-ignore/;

    for (const file of sourceFiles) {
      const text = readFileSync(file, 'utf8');
      expect(text, file).not.toMatch(dangerPattern);
      expect(text, file).not.toMatch(leakPattern);
    }

    for (const doc of REQUIRED_DOCS.filter((d) => d.endsWith('.md'))) {
      expect(readFileSync(doc, 'utf8'), doc).not.toMatch(leakPattern);
    }
  });
});
