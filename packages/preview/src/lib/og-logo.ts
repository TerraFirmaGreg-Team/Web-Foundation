import 'server-only';
import { ogPngDataUri } from '@terrafirmagreg-team/dump/lib/dump/assets/og';
import { readFile } from 'node:fs/promises';

const logoCache = new Map<string, Promise<string>>();

export function ogBrandLogo(path: string): Promise<string> {
  let cached = logoCache.get(path);
  if (!cached) {
    cached = readFile(path).then(ogPngDataUri);
    logoCache.set(path, cached);
  }
  return cached;
}
