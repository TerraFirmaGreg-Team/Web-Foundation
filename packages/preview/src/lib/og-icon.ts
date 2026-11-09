import { sectionTabs } from '@terrafirmagreg-team/sites';
import { Anvil, Feather, Flag } from 'lucide-react';

type IconNode = [string, Record<string, unknown>][];
type IconComponent = {
  render?: (props: unknown, ref: unknown) => unknown;
};

function iconAttr(key: string, value: unknown): string {
  if (value == null || key === 'key') return '';
  const name = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  return ` ${name}="${String(value).replace(/"/g, '&quot;')}"`;
}

const iconCache = new Map<IconComponent, Map<string, string | undefined>>();

function iconDataUri(
  Icon: IconComponent,
  color: string,
): string | undefined {
  let colors = iconCache.get(Icon);
  if (!colors) {
    colors = new Map();
    iconCache.set(Icon, colors);
  }
  if (colors.has(color)) return colors.get(color);
  const inner = Icon.render?.({ color, size: 24, strokeWidth: 2 }, null);
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
  colors.set(color, uri);
  return uri;
}

export function ogSectionIcon(
  section: string,
  color: string,
): string | undefined {
  const Icon = sectionTabs.find((tab) => tab.key === section)?.icon as
    | IconComponent
    | undefined;
  return Icon ? iconDataUri(Icon, color) : undefined;
}

const motifGlyphs: Record<string, IconComponent> = {
  recipe: Anvil as unknown as IconComponent,
  quest: Flag as unknown as IconComponent,
  guide: Feather as unknown as IconComponent,
};

export function ogMotifGlyph(
  section: string | undefined,
  color: string,
): string | undefined {
  const Icon = section ? motifGlyphs[section] : undefined;
  return Icon ? iconDataUri(Icon, color) : undefined;
}
