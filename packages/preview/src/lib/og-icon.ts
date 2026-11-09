import { sectionTabs } from '@terrafirmagreg-team/sites';

type IconNode = [string, Record<string, unknown>][];

function iconAttr(key: string, value: unknown): string {
  if (value == null || key === 'key') return '';
  const name = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  return ` ${name}="${String(value).replace(/"/g, '&quot;')}"`;
}

const iconCache = new Map<string, string | undefined>();

export function ogSectionIcon(
  section: string,
  color: string,
): string | undefined {
  const cacheKey = `${section}/${color}`;
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey);
  const Icon = sectionTabs.find((tab) => tab.key === section)?.icon;
  const inner = (
    Icon as
      | { render?: (props: unknown, ref: unknown) => unknown }
      | undefined
  )?.render?.({ color, size: 24, strokeWidth: 2 }, null);
  const node = (inner as { props?: { icon?: { node?: IconNode } } })?.props
    ?.icon?.node;
  const body = (node ?? [])
    .map(
      ([tag, attrs]) =>
        `<${tag}${Object.entries(attrs).map(([k, v]) => iconAttr(k, v)).join('')}/>`,
    )
    .join('');
  const markup = body
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
    : '';
  const uri = markup
    ? `data:image/svg+xml;utf8,${encodeURIComponent(markup)}`
    : undefined;
  iconCache.set(cacheKey, uri);
  return uri;
}
