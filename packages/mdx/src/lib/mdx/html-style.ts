import type { MdastNode } from './directive-utils.ts';

type NodeWithValue = MdastNode & { value: string };
type NodeWithChildren = MdastNode & { children: MdastNode[] };

function objectToCss(body: string): string | undefined {
  const entries: string[] = [];
  const re = /(\w+)\s*:\s*['"]([^'"]*)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) entries.push(`${m[1]}: ${m[2]}`);
  return entries.length ? entries.join('; ') : undefined;
}

const JSX_ATTR = /(\w[\w-]*)=\{\{([\s\S]*?)\}\}/g;

function rewriteAttrs(html: string): string {
  return html.replace(JSX_ATTR, (all, attr: string, body: string) => {
    if (attr !== 'style') return all;
    const css = objectToCss(body);
    return css ? `style="${css}"` : all;
  });
}

const OPEN_TAG = /<([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*'|\{\{[\s\S]*?\}\})*?)>/;

function stylesFromTag(tag: string): string | undefined {
  const m = /style=\{\{([\s\S]*?)\}\}/.exec(tag);
  return m ? objectToCss(m[1]!) : undefined;
}

function elementNode(
  tag: string,
  hName: string,
  children: MdastNode[],
): MdastNode {
  const style = stylesFromTag(tag);
  return {
    type: 'emphasis',
    children,
    data: {
      hName,
      ...(style ? { hProperties: { style } } : {}),
    },
  } as MdastNode;
}

function textNode(value: string): MdastNode {
  return { type: 'text', value } as MdastNode;
}

export function remarkHtmlStyle() {
  return (tree: MdastNode) => {
    const visitChildren = (parent: NodeWithChildren) => {
      const kids = parent.children;
      for (let i = 0; i < kids.length; i++) {
        const child = kids[i]!;
        if (child.type === 'html' && typeof child.value === 'string') {
          (child as NodeWithValue).value = rewriteAttrs(child.value);
        } else if (
          child.type === 'text' &&
          typeof child.value === 'string' &&
          child.value.includes('={{')
        ) {
          if (fuseJsxStyleTags(kids, i)) i--;
        } else if (child.children) {
          visitChildren(child as NodeWithChildren);
        }
      }
    };
    visitChildren(tree as NodeWithChildren);
  };
}

function fuseJsxStyleTags(kids: MdastNode[], i: number): boolean {
  const text = kids[i] as NodeWithValue;
  let open: RegExpExecArray | null;
  const re = new RegExp(OPEN_TAG.source, 'g');
  do {
    open = re.exec(text.value);
  } while (open && !open[2]?.includes('={{'));
  if (!open) return false;

  const [openTag, tagName] = open;
  const prefix = text.value.slice(0, open.index);
  const rest = text.value.slice(open.index + openTag.length);

  const closeSelf = new RegExp(`</${tagName}\\s*>`).exec(rest);
  if (closeSelf) {
    const end = closeSelf.index + closeSelf[0].length;
    kids.splice(
      i,
      1,
      ...compact([
        prefix ? textNode(prefix) : undefined,
        elementNode(openTag, tagName, [textNode(rest.slice(0, closeSelf.index))]),
        rest.slice(end) ? textNode(rest.slice(end)) : undefined,
      ]),
    );
    return true;
  }

  for (let j = i + 1; j < kids.length; j++) {
    const sib = kids[j]!;
    if (
      sib.type === 'html' &&
      typeof sib.value === 'string' &&
      new RegExp(`^</${tagName}\\s*>$`).test(sib.value.trim())
    ) {
      const inner = rest ? [textNode(rest)] : [];
      kids.splice(
        i,
        j - i + 1,
        ...compact([
          prefix ? textNode(prefix) : undefined,
          elementNode(openTag, tagName, [...inner, ...kids.slice(i + 1, j)]),
        ]),
      );
      return true;
    }
  }

  kids.splice(
    i,
    1,
    ...compact([
      prefix ? textNode(prefix) : undefined,
      elementNode(openTag, tagName, rest ? [textNode(rest)] : []),
    ]),
  );
  return true;
}

function compact(nodes: (MdastNode | undefined)[]): MdastNode[] {
  return nodes.filter((n): n is MdastNode => n !== undefined);
}

