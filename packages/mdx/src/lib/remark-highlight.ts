export type RemarkToken = { text: string; cls?: string };

const NAME = 'text-fd-primary font-medium';
const STR = 'text-diff-add-symbol';
const MUTED = 'text-fd-muted-foreground';

function attrTokens(s: string): RemarkToken[] {
  const out: RemarkToken[] = [];
  const re = /"[^"]*"|[^"]+/g;
  for (const m of s.matchAll(re)) {
    out.push({ text: m[0], cls: m[0].startsWith('"') ? STR : undefined });
  }
  return out;
}

function inlineTokens(s: string): RemarkToken[] {
  const out: RemarkToken[] = [];
  const re = /\[[^\]]*\]|\{[^}]*\}/g;
  let last = 0;
  for (const m of s.matchAll(re)) {
    if (m.index > last) out.push({ text: s.slice(last, m.index) });
    const seg = m[0];
    if (seg.startsWith('[')) {
      out.push({ text: '[', cls: MUTED });
      out.push({ text: seg.slice(1, -1), cls: STR });
      out.push({ text: ']', cls: MUTED });
    } else {
      out.push({ text: '{', cls: MUTED });
      out.push(...attrTokens(seg.slice(1, -1)));
      out.push({ text: '}', cls: MUTED });
    }
    last = m.index + seg.length;
  }
  if (last < s.length) out.push({ text: s.slice(last) });
  return out;
}

function lineTokens(line: string): RemarkToken[] {
  const fence = line.match(/^(```+)(.*)$/);
  if (fence) {
    const rest = fence[2];
    const sp = rest.search(/\s/);
    const lang = sp === -1 ? rest : rest.slice(0, sp);
    const meta = sp === -1 ? '' : rest.slice(sp);
    const toks: RemarkToken[] = [
      { text: fence[1] + lang, cls: NAME },
    ];
    if (meta) toks.push(...attrTokens(meta));
    return toks;
  }
  if (/^:{2,3}$/.test(line)) return [{ text: line, cls: NAME }];
  const dir = line.match(/^(:{1,3})([\w-]+)?(.*)$/);
  if (dir && (dir[2] || dir[1].length >= 2)) {
    return [
      { text: dir[1], cls: NAME },
      ...(dir[2] ? [{ text: dir[2], cls: NAME }] : []),
      ...inlineTokens(dir[3]),
    ];
  }
  const math = line.match(/^(\${1,2})(.*?)(\${1,2})?$/);
  if (math) {
    const toks: RemarkToken[] = [{ text: math[1], cls: NAME }];
    if (math[2]) toks.push({ text: math[2] });
    if (math[3]) toks.push({ text: math[3], cls: NAME });
    return toks;
  }
  const head = line.match(/^(#{1,6}\s)(.*)$/);
  if (head) {
    return [{ text: head[1], cls: NAME }, { text: head[2] }];
  }
  return [{ text: line }];
}

export function highlightRemark(src: string): RemarkToken[] {
  const out: RemarkToken[] = [];
  src.split('\n').forEach((line, i) => {
    if (i) out.push({ text: '\n' });
    out.push(...lineTokens(line));
  });
  return out;
}

