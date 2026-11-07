import {
  contentChildren,
  extractDirectiveLabel,
  extractLeafLabel,
  jsxAttr,
  toJsxAttributes,
  walkDirectives,
  DIRECTIVE_TYPES,
  type DirectiveNode,
  type MdastNode,
} from './directive-utils.ts';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { visit } from 'unist-util-visit';

const require = createRequire(join(process.cwd(), '_'));

function resolvePkgPath(spec: string) {
  const resolved = require.resolve(`@terrafirmagreg-team/${spec}`);
  return relative(process.cwd(), resolved).replaceAll('\\', '/');
}

export function remarkDirectives() {
  return (tree: MdastNode, file?: { value?: unknown }) => {
    pairGradients(tree);
    visit(tree as never, 'code', (node: MdastNode) => {
      if (node.lang === 'math')
        Object.assign(node, mathNode(String(node.value ?? ''), true));
    });
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
      if (type === 'leafDirective' && name === 'video') {
        Object.assign(node, {
          type: 'mdxJsxFlowElement',
          name: 'Video',
          attributes: toJsxAttributes(node),
          children: [],
        });
        return false;
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

function stripClose(node: MdastNode): boolean {
  if (node.type !== 'paragraph') return false;
  const children = (node.children ?? []) as { type?: string; value?: string }[];
  const last = children.at(-1);
  if (last?.type !== 'text' || typeof last.value !== 'string') return false;
  if (!/\s*::$/.test(last.value)) return false;
  last.value = last.value.replace(/\s*::$/, '');
  if (!last.value) children.pop();
  return true;
}

function pairGradients(parent: MdastNode): void {
  const children = parent.children;
  if (!children) return;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (
      child.type === 'leafDirective' &&
      (child as DirectiveNode).name === 'gradient'
    ) {
      const body: MdastNode[] = [];
      let closed = false;
      for (let j = i + 1; j < children.length; j++) {
        const sib = children[j];
        if (DIRECTIVE_TYPES.includes(sib.type)) break;
        body.push(sib);
        if (stripClose(sib)) {
          closed = true;
          break;
        }
      }
      if (closed) {
        while (
          body.length &&
          body.at(-1)!.type === 'paragraph' &&
          !(body.at(-1)!.children as unknown[])?.length
        )
          body.pop();
        Object.assign(child, {
          type: 'mdxJsxFlowElement',
          name: 'Gradient',
          attributes: toJsxAttributes(child as DirectiveNode),
          children: body,
        });
        children.splice(i + 1, body.length);
      }
    }
    pairGradients(child);
  }
}

