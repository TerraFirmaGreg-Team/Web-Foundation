import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as anvilIcon from 'lucide-react/icons/anvil';
import * as bookOpenIcon from 'lucide-react/icons/book-open';
import * as calculatorIcon from 'lucide-react/icons/calculator';
import * as combineIcon from 'lucide-react/icons/combine';
import * as featherIcon from 'lucide-react/icons/feather';
import * as flagIcon from 'lucide-react/icons/flag';
import * as flaskConicalIcon from 'lucide-react/icons/flask-conical';
import * as historyIcon from 'lucide-react/icons/rotate-ccw-clock';
import * as mapIcon from 'lucide-react/icons/map';
import * as scrollTextIcon from 'lucide-react/icons/scroll-text';

type IconNode = [string, Record<string, unknown>][];

function nodeOf(mod: unknown): IconNode {
  return (mod as { __iconData?: { node?: IconNode } }).__iconData?.node ?? [];
}

const iconNodes: Record<string, IconNode> = {
  anvil: nodeOf(anvilIcon),
  'book-open': nodeOf(bookOpenIcon),
  calculator: nodeOf(calculatorIcon),
  combine: nodeOf(combineIcon),
  feather: nodeOf(featherIcon),
  flag: nodeOf(flagIcon),
  'flask-conical': nodeOf(flaskConicalIcon),
  history: nodeOf(historyIcon),
  map: nodeOf(mapIcon),
  'scroll-text': nodeOf(scrollTextIcon),
};

const sectionIcons: Record<string, string> = {
  docs: 'book-open',
  guide: 'map',
  recipe: 'combine',
  quest: 'scroll-text',
  changelog: 'history',
};

const motifGlyphs: Record<string, string> = {
  recipe: 'anvil',
  quest: 'flag',
  guide: 'feather',
};

const namedGlyphs: Record<string, string> = {
  anvil: 'anvil',
  calculator: 'calculator',
  flask: 'flask-conical',
  flag: 'flag',
  feather: 'feather',
};

const iconCache = new Map<string, Map<string, string | undefined>>();

function iconDataUri(name: string, color: string): string | undefined {
  let colors = iconCache.get(name);
  if (!colors) {
    colors = new Map();
    iconCache.set(name, colors);
  }
  if (colors.has(color)) return colors.get(color);
  const node = iconNodes[name];
  const svg = node?.length
    ? renderToStaticMarkup(
        createElement(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            width: 24,
            height: 24,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: color,
            strokeWidth: 2,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          },
          node.map(([tag, attrs]) =>
            createElement(tag, attrs as Record<string, string>),
          ),
        ),
      )
    : '';
  const uri = svg
    ? `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
    : undefined;
  colors.set(color, uri);
  return uri;
}

export function ogSectionIcon(
  section: string,
  color: string,
): string | undefined {
  const name = sectionIcons[section];
  return name ? iconDataUri(name, color) : undefined;
}

export function ogMotifGlyph(
  motif: string | undefined,
  color: string,
): string | undefined {
  const name = motif ? motifGlyphs[motif] : undefined;
  return name ? iconDataUri(name, color) : undefined;
}

export function ogGlyphIcon(
  glyph: string | undefined,
  color: string,
): string | undefined {
  const name = glyph ? namedGlyphs[glyph] : undefined;
  return name ? iconDataUri(name, color) : undefined;
}
