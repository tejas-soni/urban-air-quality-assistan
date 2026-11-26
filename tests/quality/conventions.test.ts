import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

function walkTs(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkTs(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full.replace(/\\/g, '/'));
  }
  return out;
}

describe('architectural layers and code-quality conventions', () => {
  const srcFiles = walkTs('src').filter(
    (f) => !f.includes('.test.') && !f.endsWith('.d.ts') && !f.startsWith('src/test/'),
  );

  it('enforces strict layer boundaries across pure engines, providers, and UI components', () => {
    const pureEngines = srcFiles.filter((f) =>
      /^src\/lib\/(aqi|rag|http|storage|persona)\//.test(f),
    );
    for (const file of pureEngines) {
      const code = readFileSync(file, 'utf8');
      expect(code, `${file} must not import React or Next`).not.toMatch(
        /from ['"](?:react|react-dom|next|@\/components)/,
      );
    }

    const uiFiles = srcFiles.filter((f) => f.startsWith('src/components/'));
    for (const file of uiFiles) {
      const code = readFileSync(file, 'utf8');
      expect(code, `${file} must not import Node APIs or server providers`).not.toMatch(
        /from ['"](?:node:|@\/lib\/providers|@\/lib\/rag)/,
      );
    }
  });

  it('requires every source module to open with a doc banner and contain zero `as` casts', () => {
    const asCastPattern = /\bas\s+(?:unknown|any|[A-Z][A-Za-z0-9_]*|Record<)/;
    for (const file of srcFiles) {
      const raw = readFileSync(file, 'utf8');
      const stripped = raw.replace(/^'use client';\s*/, '').trimStart();
      expect(stripped.startsWith('/**'), `${file} missing opening /** module banner`).toBe(true);
      expect(raw, `${file} contains forbidden \`as\` assertion`).not.toMatch(asCastPattern);
      expect(raw.split('\n').length, `${file} exceeds 160 lines`).toBeLessThanOrEqual(160);
    }
  });
});
