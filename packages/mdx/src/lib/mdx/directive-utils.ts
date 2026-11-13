import type {
  DirectiveNode,
  JsxAttribute,
  JsxAttributeValue,
  MdastNode,
} from '../../types/mdx';

export type {
  DirectiveNode,
  JsxAttribute,
  JsxAttributeValue,
  JsxElement,
  MdastNode,
} from '../../types/mdx';

import { toJs } from 'estree-util-to-js';
import { valueToEstree } from 'estree-util-value-to-estree';
import { visit, SKIP, CONTINUE } from 'unist-util-visit';

export function walkContainers(
  tree: MdastNode,
  fn: (node: DirectiveNode) => boolean | void,
): void {
  visit(tree as never, 'containerDirective', (node) =>
    fn(node as DirectiveNode) === false ? SKIP : CONTINUE,
  );
}

export const DIRECTIVE_TYPES = [
  'containerDirective',
  'leafDirective',
  'textDirective',
];

export function walkDirectives(
  tree: MdastNode,
  fn: (node: DirectiveNode) => boolean | void,
): void {
  visit(tree as never, DIRECTIVE_TYPES, (node) =>
    fn(node as DirectiveNode) === false ? SKIP : CONTINUE,
  );
}

export function toJsxAttributes(node: DirectiveNode): JsxAttribute[] {
  return Object.entries(node.attributes ?? {}).map(([name, value]) => ({
    type: 'mdxJsxAttribute',
    name,
    value: jsxAttrValue(value),
  }));
}

function labelText(node: MdastNode): string {
  const t = node.type;
  const v = (node as { value?: unknown }).value;
  if (typeof v === 'string') return v;
  if (t === 'textDirective' || t === 'leafDirective') {
    const d = node as DirectiveNode;
    const inner = (d.children ?? []).map(labelText).join('');
    const attrs = Object.entries(d.attributes ?? {})
      .map(([k, v]) => (v == null ? k : `${k}="${v}"`))
      .join(' ');
    const prefix = t === 'leafDirective' ? '::' : ':';
    return `${prefix}${d.name ?? ''}${inner ? `[${inner}]` : ''}${attrs ? `{${attrs}}` : ''}`;
  }
  return (node.children ?? []).map(labelText).join('');
}

export function extractDirectiveLabel(node: DirectiveNode): string {
  for (const child of node.children ?? []) {
    if (child.type === 'paragraph' && child.data?.directiveLabel) {
      return (child.children ?? []).map(labelText).join('');
    }
  }
  return '';
}

export function extractLeafLabel(node: MdastNode): string {
  return (node.children ?? []).map(labelText).join('');
}

export function contentChildren(node: DirectiveNode): MdastNode[] {
  return (node.children ?? []).filter(
    (child) =>
      !(child.type === 'paragraph' && child.data?.directiveLabel),
  );
}

export function jsxAttr(name: string, value: string | boolean): JsxAttribute {
  return {
    type: 'mdxJsxAttribute',
    name,
    value: typeof value === 'boolean' ? jsxExpression(value) : value,
  };
}

export function jsxAttrValue(value: unknown): JsxAttributeValue {
  if (value == null || value === '') return jsxExpression(true);
  if (typeof value === 'boolean') return jsxExpression(value);
  return String(value);
}

export function jsxExpression(value: unknown): JsxAttributeValue {
  const expression = valueToEstree(value);
  return {
    type: 'mdxJsxAttributeValueExpression',
    value: toJs(expression as unknown as Parameters<typeof toJs>[0]).value,
    data: {
      estree: {
        type: 'Program',
        body: [{ type: 'ExpressionStatement', expression }],
        sourceType: 'module',
      },
    },
  };
}

