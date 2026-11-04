import {
  nbtAt,
  parseStackId,
  stackIdBase,
  type DumpNbt,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';

function unwrapLangKey(raw: string): string {
  const value = raw.trim();
  return value.startsWith('{') && value.endsWith('}') && value.length > 2
    ? value.slice(1, -1).trim()
    : value;
}

export function langString(
  map: Record<string, string>,
  key: string | undefined,
): string | undefined {
  if (!key) return undefined;
  const bare = unwrapLangKey(key);
  return map[key] ?? map[bare];
}

function applyFormat(template: string, args: string[]): string {
  let sequential = 0;
  return template.replace(
    /%(?:(\d+)\$)?([A-Za-z%])/g,
    (_, n: string | undefined, conv: string) => {
      if (conv === '%') return '%';
      if (conv === 'n') return '\n';
      const index = n ? Number(n) - 1 : sequential++;
      return args[index] ?? '';
    },
  );
}

export function customStackName(
  map: Record<string, string>,
  compactId: string,
): string | undefined {
  const raw = nbtAt(parseStackId(compactId).nbt, 'display', 'Name');
  if (typeof raw !== 'string' || !raw) return undefined;
  try {
    const node: unknown = JSON.parse(raw);
    if (node && typeof node === 'object') {
      return dumpTextString(map, node as Parameters<typeof dumpTextString>[1]);
    }
    if (typeof node === 'string') return node;
  } catch {

  }
  return raw;
}

export function dumpTextString(
  map: Record<string, string>,
  text: {
    translate?: string;
    text?: string;
    keybind?: string;
    with?: unknown[];
    extra?: unknown[];
  },
  keybinds?: Record<string, string>,
): string {
  const parts: string[] = [];
  if (text.translate) {
    const template = langString(map, text.translate) ?? text.translate;
    const args = Array.isArray(text.with)
      ? text.with.map((item) =>
          item && typeof item === 'object'
            ? dumpTextString(map, item as typeof text, keybinds)
            : String(item ?? ''),
        )
      : [];
    parts.push(args.length ? applyFormat(template, args) : template);
  } else if (text.text !== undefined) {
    parts.push(text.text);
  } else if (text.keybind) {
    parts.push(
      keybinds?.[text.keybind] ?? langString(map, text.keybind) ?? text.keybind,
    );
  }
  if (Array.isArray(text.extra)) {
    for (const item of text.extra) {
      if (item && typeof item === 'object') {
        parts.push(dumpTextString(map, item as typeof text, keybinds));
      }
    }
  }
  return parts.join('');
}

export function dumpTextLines(
  map: Record<string, string>,
  lines: Array<{
    translate?: string;
    text?: string;
    keybind?: string;
    with?: unknown[];
    extra?: unknown[];
  }>,
  keybinds?: Record<string, string>,
): string[] {

  return lines.map((line) => dumpTextString(map, line, keybinds));
}

export function resolveName(
  map: Record<string, string>,
  id: string,
  langKey?: string,
): string {
  if (langKey) {
    return langString(map, langKey) ?? langKey;
  }
  return langString(map, id) ?? id;
}

export function stripMcFormat(value: string): string {
  return value.replace(/§x(?:§[0-9a-f]){6}|§[0-9a-fk-or]/gi, '');
}

const KIND_LANG_PREFIXES: Record<string, readonly string[]> = {
  item: ['item', 'block'],
  block: ['block', 'item'],
  fluid: ['fluid', 'fluid_type', 'block'],
  entity: ['entity'],
  itemTag: ['tag.item'],
  blockTag: ['tag.block', 'tag.item'],
  fluidTag: ['tag.fluid'],
  entityTag: ['tag.entity'],
};

const DEFAULT_LANG_PREFIXES = ['item', 'block', 'fluid', 'fluid_type', 'entity'];
const TAG_LANG_PREFIXES = ['tag.item', 'tag.block', 'tag.fluid', 'tag.entity'];

function stackLangKeys(
  kind: string | undefined,
  id: string,
  typeKeys = true,
): string[] {
  const raw = parseStackId(id).id;
  const hashed = raw.startsWith('#');
  const resource = hashed ? raw.slice(1) : raw;
  if (!resource.includes(':')) return [];
  const [ns, path] = resource.split(':', 2);
  const flat = path.replaceAll('/', '.');
  const prefixes = hashed
    ? ((kind ? KIND_LANG_PREFIXES[kind] : undefined) ?? TAG_LANG_PREFIXES)
    : (KIND_LANG_PREFIXES[kind ?? ''] ?? DEFAULT_LANG_PREFIXES);
  return [
    ...prefixes.map((prefix) => `${prefix}.${ns}.${flat}`),
    ...(typeKeys ? [`${ns}.type.${flat}.name`, `${ns}.type.${flat}`] : []),
  ];
}

function nbtLangKeys(nbt: DumpNbt | undefined): string[] {
  if (!nbt || typeof nbt !== 'object' || Array.isArray(nbt)) return [];
  const keys: string[] = [];
  for (const [field, value] of Object.entries(nbt)) {
    if (!field.endsWith('Id') || field.length <= 2) continue;
    if (typeof value !== 'string' || !value.includes(':')) continue;
    const [ns, path] = value.split(':', 2);
    const flat = path.replaceAll('/', '.');
    const stem = field
      .slice(0, -2)
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .toLowerCase();
    if (!stem) continue;
    keys.push(`${ns}.${stem}.${flat}`, `${ns}.${stem}.${flat}.name`);
  }
  return keys;
}

export function stackDisplay(
  langMap: Record<string, string> | undefined,
  compactId: string,
  kind?: string,
  langKey?: string,
): { name: string; localized: boolean } {
  const parsed = parseStackId(compactId);
  if (!langMap) return { name: langKey ?? parsed.id, localized: false };
  const custom = customStackName(langMap, compactId);
  if (custom) return { name: stripMcFormat(custom), localized: true };
  const canonical = stackLangKeys(kind, parsed.id, false);
  const candidates: { key: string | undefined; localized: boolean }[] = [
    { key: compactId, localized: true },
    { key: langKey, localized: true },
    ...nbtLangKeys(parsed.nbt).map((key) => ({ key, localized: true })),
    ...canonical.map((key) => ({ key, localized: true })),
    ...stackLangKeys(kind, parsed.id, true)
      .slice(canonical.length)
      .map((key) => ({ key, localized: false })),
    { key: parsed.id, localized: false },
  ];
  for (const { key, localized } of candidates) {
    if (!key) continue;
    const value = langString(langMap, key);
    if (value !== undefined) {
      return { name: stripMcFormat(value), localized };
    }
  }
  return {
    name: humanizeKey(langKey ?? stackIdBase(compactId)),
    localized: false,
  };
}

export function stackDisplayName(
  langMap: Record<string, string> | undefined,
  compactId: string,
  kind?: string,
  langKey?: string,
): string {
  return stackDisplay(langMap, compactId, kind, langKey).name;
}

export function humanizeKey(key: string): string {
  const value = unwrapLangKey(key);
  const segment = value.includes(':')
    ? (value.split(':', 2)[1] ?? value)
    : (value.split('.').pop() ?? value);
  const words = segment
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[_.\-/]+/)
    .filter(Boolean);
  if (!words.length) return key;
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function creativeTabName(
  map: Record<string, string>,
  nameKey?: string,
): string {
  return langString(map, nameKey) ?? humanizeKey(nameKey ?? '');
}

export function isTechnicalId(map: Record<string, string>, id: string): boolean {
  return resolveName(map, id) === id;
}

