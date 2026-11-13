import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { sectionTabs } from '@terrafirmagreg-team/sites';
import {
  Anvil,
  Calculator,
  Feather,
  Flag,
  FlaskConical,
  type LucideIcon,
} from 'lucide-react';

const iconCache = new Map<LucideIcon, Map<string, string>>();

function iconDataUri(Icon: LucideIcon, color: string): string {
  let colors = iconCache.get(Icon);
  if (!colors) {
    colors = new Map();
    iconCache.set(Icon, colors);
  }
  let uri = colors.get(color);
  if (!uri) {
    const svg = renderToStaticMarkup(
      createElement(Icon, { color, size: 24, strokeWidth: 2 }),
    );
    uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    colors.set(color, uri);
  }
  return uri;
}

export function ogSectionIcon(
  section: string,
  color: string,
): string | undefined {
  const Icon = sectionTabs.find((tab) => tab.key === section)?.icon as
    | LucideIcon
    | undefined;
  return Icon ? iconDataUri(Icon, color) : undefined;
}

const motifGlyphs: Record<string, LucideIcon> = {
  recipe: Anvil,
  quest: Flag,
  guide: Feather,
};

export function ogMotifGlyph(
  section: string | undefined,
  color: string,
): string | undefined {
  const Icon = section ? motifGlyphs[section] : undefined;
  return Icon ? iconDataUri(Icon, color) : undefined;
}

const namedGlyphs: Record<string, LucideIcon> = {
  anvil: Anvil,
  calculator: Calculator,
  flask: FlaskConical,
  flag: Flag,
  feather: Feather,
};

export function ogGlyphIcon(
  name: string,
  color: string,
): string | undefined {
  const Icon = namedGlyphs[name];
  return Icon ? iconDataUri(Icon, color) : undefined;
}
