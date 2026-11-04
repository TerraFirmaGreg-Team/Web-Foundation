import type {
  GuideFormatNode,
  GuideFormatOptions,
  PageRendererProps,
} from '@terrafirmagreg-team/guide/types';
import { MC_FORMAT_COLORS } from '@terrafirmagreg-team/dump/lib/dump/contract/text';
import { langString } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';

type State = {
  styles: string[];
  color?: string;
  link?: string;
  tooltip?: string;
};

function macroReplacement(
  name: string,
  token: string,
  macros: Record<string, string>,
): string | undefined {
  const found = macros[name] ?? macros[token] ?? macros[`$(${name})`];
  if (found !== undefined && found !== token) return found;
  return undefined;
}

function expandMacros(
  raw: string,
  macros: Record<string, string> | undefined,
) {
  let value = raw;
  const replacements = macros ?? {};
  for (let depth = 0; depth < 16; depth++) {
    let changed = false;
    value = value.replace(/\$\(([A-Za-z0-9_.-]+)\)/g, (token, name) => {
      const replacement = macroReplacement(name, token, replacements);
      if (replacement === undefined) return token;
      changed = true;
      return replacement;
    });
    if (!changed || value.length > 100_000) return value.slice(0, 100_000);
  }
  return value;
}

function appendText(out: GuideFormatNode[], value: string, state: State) {
  if (!value) return;
  value = value.replace(/[◼■⬛]/g, '$&︎');
  const parts = value.split(/(§[0-9a-fk-or])/i);
  let active = { ...state, styles: [...state.styles] };
  for (const part of parts) {
    const code = /^§([0-9a-fk-or])$/i.exec(part)?.[1]?.toLowerCase();
    if (!code) {
      if (part) out.push({ type: 'text', value: part, ...active });
      continue;
    }
    if (code === 'r') {
      active = { styles: [] };
    } else if (code in MC_FORMAT_COLORS) {
      active.color = MC_FORMAT_COLORS[code];
    } else {
      const style =
        code === 'l'
          ? 'bold'
          : code === 'o'
            ? 'italic'
            : code === 'm'
              ? 'strike'
              : code === 'n'
                ? 'underline'
                : code === 'k'
                  ? 'obfuscated'
                  : undefined;
      if (style && !active.styles.includes(style)) active.styles.push(style);
    }
  }
}

function pushStyle(state: State, style: string) {
  return state.styles.includes(style)
    ? state
    : { ...state, styles: [...state.styles, style] };
}

function colorFor(token: string): string | undefined {
  if (/^#[0-9a-f]{6}$/i.test(token)) return token;
  if (/^#[0-9a-f]{3}$/i.test(token)) {
    return `#${token[1]}${token[1]}${token[2]}${token[2]}${token[3]}${token[3]}`;
  }
  if (/^0x[0-9a-f]{6}$/i.test(token)) return `#${token.slice(2)}`;
  if (token.length === 1) return MC_FORMAT_COLORS[token.toLowerCase()];
  const named: Record<string, string> = {
    thing: '#449900',
    item: '#bb00bb',
    header: 'var(--color-foreground)',
  };
  return named[token];
}

const styleAliases: Record<string, string> = {
  bold: 'bold',
  italic: 'italic',
  strike: 'strike',
  strikethrough: 'strike',
  obfuscated: 'obfuscated',
  underline: 'underline',
  l: 'bold',
  o: 'italic',
  m: 'strike',
  n: 'underline',
  k: 'obfuscated',
};

export function formatGuide(
  raw: string,
  options: GuideFormatOptions = {},
): GuideFormatNode[] {
  const out: GuideFormatNode[] = [];
  const source = expandMacros(raw, options.macros);
  let state: State = { styles: [] };
  let last = 0;
  const tokens = /\$\(([^)]*)\)/g;
  let match: RegExpExecArray | null;

  while ((match = tokens.exec(source)) !== null) {
    appendText(out, source.slice(last, match.index), state);
    last = tokens.lastIndex;
    const token = (match[1] ?? '').trim();
    if (!token || token === 'reset' || token === 'clear') {
      state = { styles: [] };
      continue;
    }
    if (token === 'br' || token === 'br2') {
      const breaks = token === 'br2' ? 2 : 1;
      for (let index = 0; index < breaks; index++)
        out.push({ type: 'break' });
      continue;
    }
    const li = /^li(\d*)$/.exec(token);
    if (li) {
      out.push({ type: 'break' });
      const level = li[1] ? Number(li[1]) : 1;
      appendText(out, `${'  '.repeat(Math.max(level, 1) - 1)}• `, state);
      continue;
    }
    if (token === '/l') {
      state = { ...state, link: undefined };
      continue;
    }
    if (token === '/t') {
      state = { ...state, tooltip: undefined };
      continue;
    }
    if (token.startsWith('k:')) {
      out.push({ type: 'keybind', value: token.slice(2) });
      continue;
    }
    if (token.startsWith('command:')) {
      out.push({ type: 'command', value: token.slice(8) });
      continue;
    }
    if (token.startsWith('l:') || token.startsWith('url:')) {
      state = { ...state, link: token.slice(token.indexOf(':') + 1) };
      continue;
    }
    if (token.startsWith('t:') || token.startsWith('tooltip:')) {
      state = {
        ...state,
        tooltip: token.slice(token.indexOf(':') + 1),
      };
      continue;
    }
    if (token === 'playername') {
      appendText(out, 'Player', state);
      continue;
    }
    if (token === 'p') {
      out.push({ type: 'break' });
      continue;
    }
    const color = colorFor(token);
    if (color) {
      state = { ...state, color };
      continue;
    }
    const style = styleAliases[token];
    if (style) {
      state = pushStyle(state, style);
    }
  }
  appendText(out, source.slice(last), state);
  return out;
}

export function guideFormatOpts(props: PageRendererProps) {
  return {
    dataset: props.dataset,
    lang: props.lang,
    modId: props.bookModId,
    bookPath: props.bookPath,
    categoryByEntry: props.categoryByEntry,
    macros: props.book?.macros,
    langMap: props.langMap,
    keybinds: props.keybinds,
    questLinks: props.questLinks,
    previews: props.previews,
  };
}

function prettyKeyId(id: string): string {
  return id
    .replace(/^key\.(?:keyboard\.|mouse\.|categories\.)?/i, '')
    .replace(/[._]+/g, ' ')
    .trim()
    .replace(/\b[a-z]/g, (ch) => ch.toUpperCase());
}

export function keybindLabels(
  bindId: string,
  langMap: Record<string, string>,
  keybinds: Record<string, string>,
): { label: string; title: string } {
  const defaultKey = keybinds[bindId];
  const keyName = defaultKey
    ? (langString(langMap, defaultKey) ?? prettyKeyId(defaultKey))
    : undefined;
  const bindName = langString(langMap, bindId) ?? prettyKeyId(bindId);
  return {
    label: keyName ?? bindName,
    title: bindName,
  };
}

