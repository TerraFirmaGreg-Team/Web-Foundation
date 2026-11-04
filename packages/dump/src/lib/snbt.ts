const WS = /[ \t\n\r]/;

const SAFE_KEY = /^[A-Za-z0-9_.\-+]+$/;
const SAFE_VALUE = /^[A-Za-z_][A-Za-z0-9_.\-+]*$/;
const LITERAL_WORD = /^(true|false|null|nan|infinity)$/i;
const MAX_SAFE = 2 ** 53;

export function formatNbt(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return writeNbtValue(value);
}

function writeNbtValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return writeNbtNumber(value);
  if (typeof value === 'string') return writeNbtString(value);
  if (Array.isArray(value)) return `[${value.map(writeNbtValue).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0,
    );
    return `{${entries.map(([k, v]) => `${writeNbtKey(k)}:${writeNbtValue(v)}`).join(',')}}`;
  }
  return 'null';
}

function writeNbtKey(key: string): string {
  return SAFE_KEY.test(key) ? key : JSON.stringify(key);
}

function writeNbtString(value: string): string {
  return SAFE_VALUE.test(value) && !LITERAL_WORD.test(value)
    ? value
    : JSON.stringify(value);
}

function writeNbtNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (Number.isInteger(value) && Math.abs(value) <= MAX_SAFE) return value.toFixed(0);
  return String(value);
}

export function formatNbtPretty(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return prettyNbtValue(value, 0);
}

function prettyNbtValue(value: unknown, depth: number): string {
  const pad = '  '.repeat(depth);
  const padIn = `${pad}  `;
  if (value !== null && typeof value === 'object') {
    if (Array.isArray(value)) {
      if (!value.length) return '[]';
      if (value.every((v) => v === null || typeof v !== 'object')) {
        return `[${value.map(writeNbtValue).join(', ')}]`;
      }
      return `[\n${value
        .map((v) => `${padIn}${prettyNbtValue(v, depth + 1)}`)
        .join(',\n')}\n${pad}]`;
    }
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0,
    );
    if (!entries.length) return '{}';
    return `{\n${entries
      .map(([k, v]) => `${padIn}${writeNbtKey(k)}: ${prettyNbtValue(v, depth + 1)}`)
      .join(',\n')}\n${pad}}`;
  }
  return writeNbtValue(value);
}

export function parseSnbt(text: string): unknown {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const parser = { src, i: 0 };
  const value = readValue(parser);
  skip(parser);
  if (parser.i < parser.src.length) {
    throw new Error(`SNBT trailing data at ${parser.i}`);
  }
  return value;
}

type Parser = { src: string; i: number };

function peek(p: Parser): string {
  return p.src[p.i] ?? '';
}

function eof(p: Parser): boolean {
  return p.i >= p.src.length;
}

function skip(p: Parser): void {
  while (!eof(p)) {
    const c = peek(p);
    if (WS.test(c) || c === ',') {
      p.i++;
      continue;
    }
    if (c === '/' && p.src[p.i + 1] === '/') {
      p.i += 2;
      while (!eof(p) && peek(p) !== '\n') p.i++;
      continue;
    }
    break;
  }
}

function readValue(p: Parser): unknown {
  skip(p);
  const c = peek(p);
  if (!c) throw new Error('SNBT unexpected end');
  if (c === '{') return readCompound(p);
  if (c === '[') return readList(p);
  if (c === '"') return readString(p);
  return readBare(p);
}

function readCompound(p: Parser): Record<string, unknown> {
  p.i++;
  const out: Record<string, unknown> = {};
  while (true) {
    skip(p);
    if (peek(p) === '}') {
      p.i++;
      return out;
    }
    if (eof(p)) throw new Error('SNBT unclosed compound');
    const key = peek(p) === '"' ? readString(p) : readUnquoted(p);
    skip(p);
    if (peek(p) !== ':') throw new Error(`SNBT expected ':' after key ${key}`);
    p.i++;
    out[key] = readValue(p);
  }
}

function readList(p: Parser): unknown[] {
  p.i++;
  skip(p);
  if (/^[BILbils][ \t]*;/.test(p.src.slice(p.i, p.i + 8))) {
    p.i++;
    skip(p);
    if (peek(p) === ';') p.i++;
  }
  const out: unknown[] = [];
  while (true) {
    skip(p);
    if (peek(p) === ']') {
      p.i++;
      return out;
    }
    if (eof(p)) throw new Error('SNBT unclosed list');
    out.push(readValue(p));
  }
}

function readString(p: Parser): string {
  p.i++;
  let out = '';
  while (!eof(p)) {
    const c = peek(p);
    p.i++;
    if (c === '"') return out;
    if (c !== '\\') {
      out += c;
      continue;
    }
    const next = peek(p);
    p.i++;
    switch (next) {
      case 'n':
        out += '\n';
        break;
      case 't':
        out += '\t';
        break;
      case 'r':
        out += '\r';
        break;
      case 'b':
        out += '\b';
        break;
      case 'f':
        out += '\f';
        break;
      case 'u': {
        const hex = p.src.slice(p.i, p.i + 4);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          out += String.fromCharCode(Number.parseInt(hex, 16));
          p.i += 4;
        } else {
          out += 'u';
        }
        break;
      }
      case '"':
      case '\\':
        out += next;
        break;
      default:
        out += next;
    }
  }
  throw new Error('SNBT unclosed string');
}

function readUnquoted(p: Parser): string {
  const start = p.i;
  while (!eof(p)) {
    const c = peek(p);
    if (
      c === ':' ||
      c === '{' ||
      c === '}' ||
      c === '[' ||
      c === ']' ||
      c === ',' ||
      WS.test(c)
    ) {
      break;
    }
    p.i++;
  }
  if (p.i === start) throw new Error(`SNBT expected key at ${p.i}`);
  return p.src.slice(start, p.i);
}

function readBare(p: Parser): string | number | boolean {
  const raw = readUnquoted(p);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  const num = parseSnbtNumber(raw);
  return num === undefined ? raw : num;
}

const NUM = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?[bBsSlLfFdD]?$/;

function parseSnbtNumber(raw: string): number | undefined {
  if (!NUM.test(raw)) return undefined;
  const last = raw[raw.length - 1];
  const core =
    last && /[bBsSlLfFdD]/.test(last) && !/\d/.test(last) ? raw.slice(0, -1) : raw;
  const value = Number(core);
  return Number.isFinite(value) ? value : undefined;
}

