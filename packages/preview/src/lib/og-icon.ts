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
  'rotate-ccw-clock': nodeOf(historyIcon),
  map: nodeOf(mapIcon),
  'scroll-text': nodeOf(scrollTextIcon),
};

const sectionIcons: Record<string, string> = {
  docs: 'book-open',
  guide: 'map',
  recipe: 'combine',
  quest: 'scroll-text',
  changelog: 'rotate-ccw-clock',
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

function attr(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function iconSvg(node: IconNode, color: string): string {
  const body = node
    .map(
      ([tag, attrs]) =>
        `<${tag}${Object.entries(attrs)
          .map(([key, value]) =>
            value == null || key === 'key'
              ? ''
              : ` ${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}="${attr(value)}"`,
          )
          .join('')}/>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${attr(color)}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

const iconCache = new Map<string, Map<string, string | undefined>>();

function iconDataUri(name: string, color: string): string | undefined {
  let colors = iconCache.get(name);
  if (!colors) {
    colors = new Map();
    iconCache.set(name, colors);
  }
  if (colors.has(color)) return colors.get(color);
  const node = iconNodes[name];
  const uri = node?.length
    ? `data:image/svg+xml;utf8,${encodeURIComponent(iconSvg(node, color))}`
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
