const ELEMENT_COLORS: Record<string, string> = {
  H: '#FFFFFF',
  D: '#FFFFC0',
  T: '#FFFFA0',
  He: '#D9FFFF',
  Li: '#CC80FF',
  Be: '#C2FF00',
  B: '#FFB5B5',
  C: '#909090',
  N: '#3050F8',
  O: '#FF0D0D',
  F: '#90E050',
  Ne: '#B3E3F5',
  Na: '#AB5CF2',
  Mg: '#8AFF00',
  Al: '#BFA6A6',
  Si: '#F0C8A0',
  P: '#FF8000',
  S: '#FFFF30',
  Cl: '#1FF01F',
  Ar: '#80D1E3',
  K: '#8F40D4',
  Ca: '#3DFF00',
  Sc: '#E6E6E6',
  Ti: '#BFC2C7',
  V: '#A6A6AB',
  Cr: '#8A99C7',
  Mn: '#9C7AC7',
  Fe: '#E06633',
  Co: '#F090A0',
  Ni: '#50D050',
  Cu: '#C88033',
  Zn: '#7D80B0',
  Ga: '#C28F8F',
  Ge: '#668F8F',
  As: '#BD80E3',
  Se: '#FFA100',
  Br: '#A62929',
  Kr: '#5CB8D1',
  Rb: '#702EB0',
  Sr: '#00FF00',
  Y: '#94FFFF',
  Zr: '#94E0E0',
  Nb: '#73C2C9',
  Mo: '#54B5B5',
  Tc: '#3B9E9E',
  Ru: '#248F8F',
  Rh: '#0A7D8C',
  Pd: '#000000',
  Ag: '#C0C0C0',
  Cd: '#FFD98F',
  In: '#A67573',
  Sn: '#668080',
  Sb: '#9E63B5',
  Te: '#D47A00',
  I: '#940094',
  Xe: '#429EB0',
  Cs: '#57178F',
  Ba: '#00C900',
  La: '#70D4FF',
  Ce: '#FFFFC7',
  Pr: '#D9FFC7',
  Nd: '#C7FFC7',
  Pm: '#A3FFC7',
  Sm: '#8FFFC7',
  Eu: '#61FFC7',
  Gd: '#45FFC7',
  Tb: '#30FFC7',
  Dy: '#1FFFC7',
  Ho: '#00FF9C',
  Er: '#00E675',
  Tm: '#00D452',
  Yb: '#00BF38',
  Lu: '#00AB24',
  Hf: '#4DC2FF',
  Ta: '#4DA6FF',
  W: '#2194D6',
  Re: '#267DAB',
  Os: '#266696',
  Ir: '#175487',
  Pt: '#D0D0E0',
  Au: '#FFD123',
  Hg: '#B8B8D0',
  Tl: '#A6544D',
  Pb: '#575961',
  Bi: '#9E4FB5',
  Po: '#AB5C00',
  At: '#754F45',
  Rn: '#428296',
  Fr: '#420066',
  Ra: '#000000',
  Ac: '#70ABFA',
  Th: '#00BAFF',
  Pa: '#00A1FF',
  U: '#008FFF',
  Np: '#0080FF',
  Pu: '#000000',
  Am: '#545CF2',
  Cm: '#785CE3',
  Bk: '#8A4FE3',
  Cf: '#A136D4',
  Es: '#B31FD4',
  Fm: '#B31FBA',
  Md: '#B30DA6',
  No: '#BD0D87',
  Lr: '#C70066',
  Rf: '#CC0059',
  Db: '#D1004F',
  Sg: '#D90045',
  Bh: '#E00038',
  Hs: '#E6002E',
  Mt: '#EB0026',
  Ds: '#EB0026',
  Rg: '#FFFF55',
  Cn: '#FFFF55',
  Nh: '#FFFF55',
  Fl: '#FFFF55',
  Mc: '#FFFF55',
  Lv: '#FFFF55',
  Ts: '#FFFF55',
  Og: '#FFFF55',
  Nq: '#FFFF55',
  Ke: '#FFFF55',
  Tr: '#FFFF55',
  Dr: '#FFFF55',
  Nt: '#FFFF55',
};

const MIN_BRIGHTNESS = 0.1;

function lightenHex(hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r / 255) h = ((g / 255 - b / 255) / delta) % 6;
    else if (max === g / 255) h = (b / 255 - r / 255) / delta + 2;
    else h = (r / 255 - g / 255) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : delta / max;
  const v = Math.max(max, MIN_BRIGHTNESS);
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [rp, gp, bp] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  const to255 = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to255(rp)}${to255(gp)}${to255(bp)}`;
}

const LIGHTENED = new Map<string, string>();
function elementColor(symbol: string): string | undefined {
  const raw = ELEMENT_COLORS[symbol];
  if (!raw) return undefined;
  const cached = LIGHTENED.get(symbol);
  if (cached) return cached;
  const color = lightenHex(raw);
  LIGHTENED.set(symbol, color);
  return color;
}

const SUBSCRIPT = '₀₁₂₃₄₅₆₇₈₉';
const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻';
const PUNCT = new Set('()[]{}·∙.*+?=-‐‑‒–—~≈≡,');

export type FormulaRun = { text: string; color?: string };

export function formulaRuns(plain: string): FormulaRun[] | null {
  if (!plain || plain.length < 2) return null;
  const runs: FormulaRun[] = [];
  let i = 0;
  let elements = 0;
  let pushPlain = (text: string) => {
    const last = runs[runs.length - 1];
    if (last && !last.color) last.text += text;
    else runs.push({ text });
  };
  while (i < plain.length) {
    const ch = plain[i];
    if (ch >= 'A' && ch <= 'Z') {
      const two = plain.slice(i, i + 2);
      const symbol = /^[a-z]$/.test(plain[i + 1] ?? '') ? two : ch;
      const color = elementColor(symbol);
      if (!color) return null;
      runs.push({ text: symbol, color });
      elements += 1;
      i += symbol.length;
      continue;
    }
    if ((ch >= '0' && ch <= '9') || SUBSCRIPT.includes(ch)) {
      let j = i;
      while (j < plain.length && /[0-9]/.test(plain[j])) j += 1;
      while (j < plain.length && SUBSCRIPT.includes(plain[j])) j += 1;
      pushPlain(plain.slice(i, j));
      i = j;
      continue;
    }
    if (SUPERSCRIPT.includes(ch) || PUNCT.has(ch)) {
      pushPlain(ch);
      i += 1;
      continue;
    }
    return null;
  }
  return elements > 0 ? runs : null;
}

