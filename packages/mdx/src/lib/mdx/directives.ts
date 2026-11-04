import {
  contentChildren,
  extractDirectiveLabel,
  extractLeafLabel,
  jsxAttr,
  jsxExpression,
  toJsxAttributes,
  walkDirectives,
  type DirectiveNode,
  type MdastNode,
} from './directive-utils.ts';
import { gradientImage } from '@terrafirmagreg-team/ui/lib/mdx/gradient';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';

const require = createRequire(join(process.cwd(), '_'));

function resolvePkgPath(spec: string) {
  const resolved = require.resolve(`@terrafirmagreg-team/${spec}`);
  return relative(process.cwd(), resolved).replaceAll('\\', '/');
}

export function remarkDirectives() {
  return (tree: MdastNode, file?: { value?: unknown }) => {
    walkDirectives(tree, (node) => {
      const { type, name } = node;
      if (
        name === 'math' &&
        (type === 'textDirective' ||
          type === 'leafDirective' ||
          type === 'containerDirective')
      ) {
        const block = type !== 'textDirective';
        const tex =
          type === 'containerDirective'
            ? containerBody(node, file)
            : extractLeafLabel(node).trim();
        Object.assign(node, mathNode(tex, block));
        return false;
      }
      if (type === 'textDirective' && name === 'gradient') {
        Object.assign(node, {
          type: 'mdxJsxTextElement',
          name: 'span',
          attributes: [
            styleAttr(gradientStyle(node)),
            { type: 'mdxJsxAttribute', name: 'data-md', value: 'gradient' },
          ],
        });
        return;
      }
      if (
        name === 'glow' &&
        (type === 'textDirective' ||
          type === 'leafDirective' ||
          type === 'containerDirective')
      ) {
        Object.assign(node, {
          type:
            type === 'textDirective'
              ? 'mdxJsxTextElement'
              : 'mdxJsxFlowElement',
          name: 'span',
          attributes: [
            styleAttr(glowStyle(node)),
            { type: 'mdxJsxAttribute', name: 'data-md', value: 'glow' },
          ],
        });
        return type === 'containerDirective' ? undefined : false;
      }
      if (type === 'textDirective' && name === 'icon') {
        Object.assign(node, {
          type: 'mdxJsxTextElement',
          name: 'Icon',
          attributes: [jsxAttr('name', extractLeafLabel(node).trim())],
          children: [],
        });
        return;
      }
      if (
        name === 'card' &&
        (type === 'leafDirective' || type === 'containerDirective')
      ) {
        const title =
          type === 'leafDirective'
            ? extractLeafLabel(node)
            : extractDirectiveLabel(node);
        Object.assign(node, {
          type: 'mdxJsxFlowElement',
          name: 'Card',
          attributes: [
            jsxAttr('title', title.trim()),
            ...toJsxAttributes(node),
          ],
          children:
            type === 'containerDirective' ? contentChildren(node) : [],
        });
        return false;
      }
      if (type === 'containerDirective' && name === 'cards') {
        Object.assign(node, {
          type: 'mdxJsxFlowElement',
          name: 'Cards',
          attributes: toJsxAttributes(node),
          children: contentChildren(node),
        });
        return;
      }
      if (type === 'leafDirective' && name === 'type-table') {
        const attrs = node.attributes;
        if (typeof attrs?.path === 'string' && attrs.path.startsWith('pkg:'))
          attrs.path = resolvePkgPath(attrs.path.slice(4));
        Object.assign(node, {
          type: 'mdxJsxFlowElement',
          name: 'auto-type-table',
          attributes: toJsxAttributes(node),
          children: [],
        });
        return false;
      }
      if (type === 'leafDirective' && name === 'recipe') {
        Object.assign(node, {
          type: 'mdxJsxFlowElement',
          name: 'Recipe',
          attributes: [
            {
              type: 'mdxJsxAttribute',
              name: 'id',
              value: extractLeafLabel(node).trim(),
            },
            ...toJsxAttributes(node),
          ],
          children: [],
        });
        return false;
      }
      return undefined;
    });
  };
}

function mathNode(tex: string, block: boolean): MdastNode {
  const code = {
    type: 'element',
    tagName: 'code',
    properties: { className: ['language-math', 'math-display'] },
    children: [{ type: 'text', value: tex }],
  };
  return block
    ? ({
        type: 'math',
        value: tex,
        data: { hName: 'pre', hChildren: [code] },
      } as unknown as MdastNode)
    : ({
        type: 'inlineMath',
        value: tex,
        data: {
          hName: 'code',
          hProperties: { className: ['language-math', 'math-inline'] },
          hChildren: [{ type: 'text', value: tex }],
        },
      } as unknown as MdastNode);
}

function containerBody(
  node: DirectiveNode,
  file?: { value?: unknown },
): string {
  const source = typeof file?.value === 'string' ? file.value : '';
  const pos = node.position as
    | { start?: { offset?: number }; end?: { offset?: number } }
    | undefined;
  const start = pos?.start?.offset;
  const end = pos?.end?.offset;
  if (typeof start !== 'number' || typeof end !== 'number' || !source)
    return '';
  const lines = source.slice(start, end).split('\n');
  return lines
    .slice(1, lines[lines.length - 1]?.trim() === ':::' ? -1 : undefined)
    .join('\n')
    .trim();
}

function estreeObject(entries: [string, string][]): unknown {
  return {
    type: 'ObjectExpression',
    properties: entries.map(([key, value]) => ({
      type: 'Property',
      key: { type: 'Literal', value: key },
      value: { type: 'Literal', value, raw: JSON.stringify(value) },
      kind: 'init',
      computed: false,
      shorthand: false,
    })),
  };
}

function styleAttr(entries: [string, string][]) {
  return {
    type: 'mdxJsxAttribute' as const,
    name: 'style',
    value: jsxExpression(estreeObject(entries)),
  };
}

function attr(node: DirectiveNode, name: string) {
  const value = node.attributes?.[name];
  return typeof value === 'string' && value ? value : undefined;
}

function hasFlag(node: DirectiveNode, name: string) {
  return node.attributes?.[name] !== undefined;
}

function gradientStyle(node: DirectiveNode): [string, string][] {
  return [
    ['backgroundImage', gradientImage(attrObject(node))],
    ['WebkitBackgroundClip', 'text'],
    ['backgroundClip', 'text'],
    ['WebkitTextFillColor', 'transparent'],
    ['color', 'transparent'],
  ];
}

function glowStyle(node: DirectiveNode): [string, string][] {
  const from = attr(node, 'from') ?? '#fa18cf';
  const to = attr(node, 'to') ?? '#ff7967';
  const gradient = gradientImage(attrObject(node));
  const boxBg = `radial-gradient(color-mix(in srgb, ${from} 18%, transparent), color-mix(in srgb, ${to} 8%, transparent))`;
  const style: [string, string][] = [
    ['display', 'block'],
    ['borderRadius', '20px'],
    ['border', '1px solid transparent'],
    ['padding', '0.625rem 1rem'],
    ['marginBottom', '1.5rem'],
    ['textAlign', 'center'],
    ['backgroundImage', hasFlag(node, 'gradient') ? `${gradient}, ${boxBg}` : boxBg],
    ['boxShadow', `0 10px 20px color-mix(in srgb, ${from} 25%, transparent)`],
  ];
  if (hasFlag(node, 'gradient')) {
    style.push(
      ['WebkitBackgroundClip', 'text, border-box'],
      ['backgroundClip', 'text, border-box'],
      ['WebkitTextFillColor', 'transparent'],
      ['color', 'transparent'],
    );
  }
  if (hasFlag(node, 'fade')) style.push(['borderImage', `${gradient} 1`]);
  return style;
}

function attrObject(node: DirectiveNode) {
  return {
    from: attr(node, 'from'),
    to: attr(node, 'to'),
    dir: attr(node, 'dir'),
    image: attr(node, 'image'),
  };
}

