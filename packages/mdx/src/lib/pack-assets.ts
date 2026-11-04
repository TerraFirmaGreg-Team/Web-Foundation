import type { DocsImageProps } from '../types/mdx';

export function packPublicUrl(pack: string, ...segments: string[]): string {
  const rel = segments
    .map((s) => s.replace(/^\/+/, '').replaceAll('\\', '/'))
    .filter(Boolean)
    .join('/');
  return rel ? `/${pack}/${rel}` : `/${pack}`;
}

export function assetUrl(
  pack: string,
  modId: string,
  ...pathSegments: string[]
): string {
  return packPublicUrl(pack, 'assets', modId, ...pathSegments);
}

export function resolveSrc(
  props: Pick<DocsImageProps, 'src' | 'pack' | 'mod' | 'path'>,
  packFallback?: string,
): string | null {
  if (props.src) {
    const s = props.src.trim();
    if (
      s.startsWith('/') ||
      s.startsWith('http://') ||
      s.startsWith('https://')
    ) {
      return s;
    }
    return `/${s.replace(/^\/+/, '')}`;
  }

  const pack = props.pack ?? packFallback;
  if (!pack) return null;

  if (props.mod && props.path) {
    return assetUrl(pack, props.mod, props.path);
  }
  if (props.path) {
    return packPublicUrl(pack, props.path);
  }
  return null;
}

