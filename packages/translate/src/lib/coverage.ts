import 'server-only';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type TranslationState = 'untranslated' | 'partial' | 'ok';

function proseLines(text: string): string[] {
  const out: string[] = [];
  let fence = false;
  let frontmatter = false;
  let body = false;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!body) {
      if (!line) continue;
      body = true;
      if (line === '---') {
        frontmatter = true;
        continue;
      }
    }
    if (frontmatter) {
      if (line === '---' || line === '...') frontmatter = false;
      continue;
    }
    if (line.startsWith('```')) {
      fence = !fence;
      continue;
    }
    if (fence || !line) continue;
    if (
      line.startsWith('import ') ||
      line.startsWith('export ') ||
      line.startsWith('<') ||
      line.startsWith(':::')
    ) {
      continue;
    }
    out.push(line);
  }
  return out;
}

export function translationState(src: string, ref: string): TranslationState {
  if (src === ref) return 'untranslated';
  const lines = proseLines(src);
  if (lines.length < 5) return 'ok';
  const refSet = new Set(proseLines(ref));
  const shared = lines.filter((line) => refSet.has(line)).length;
  return shared / lines.length >= 0.7 ? 'partial' : 'ok';
}

export function readPageSource(
  contentDir: string,
  pagePath: string,
): string | undefined {
  try {
    return readFileSync(
      join(
        process.cwd(),
        'content',
        contentDir.replace(/^content[\\/]?/, ''),
        pagePath.replace(/\\/g, '/'),
      ),
      'utf8',
    );
  } catch {
    return undefined;
  }
}

