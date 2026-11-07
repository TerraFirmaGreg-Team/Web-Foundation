import { nameToEmoji } from 'gemoji';
import { visit } from 'unist-util-visit';
import {
  DIRECTIVE_TYPES,
  type DirectiveNode,
  type MdastNode,
} from './directive-utils.ts';

type Pos = { start?: { offset?: number }; end?: { offset?: number } };
type File = { value?: unknown };

function sliceSource(node: MdastNode, file?: File): string | undefined {
  const source = typeof file?.value === 'string' ? file.value : '';
  const pos = node.position as Pos | undefined;
  const start = pos?.start?.offset;
  const end = pos?.end?.offset;
  if (typeof start !== 'number' || typeof end !== 'number' || !source)
    return undefined;
  return source.slice(start, end);
}

function labelText(nodes: MdastNode[] | undefined): string {
  return (nodes ?? [])
    .map((child) =>
      typeof (child as { value?: unknown }).value === 'string'
        ? ((child as { value?: unknown }).value as string)
        : '',
    )
    .join('');
}

function literalMarker(node: DirectiveNode): string {
  const prefix =
    node.type === 'containerDirective'
      ? ':::'
      : node.type === 'leafDirective'
        ? '::'
        : ':';
  const label = labelText(node.children);
  const attrs = Object.entries(node.attributes ?? {})
    .map(([key, value]) =>
      value == null || value === true || value === ''
        ? key
        : `${key}="${String(value)}"`,
    )
    .join(' ');
  return `${prefix}${node.name ?? ''}${label ? `[${label}]` : ''}${attrs ? `{${attrs}}` : ''}`;
}

function toText(node: MdastNode, value: string): void {
  const rest = node as unknown as Record<string, unknown>;
  delete rest.name;
  delete rest.attributes;
  delete rest.children;
  Object.assign(node, { type: 'text', value });
}

export function remarkDirectiveFallback() {
  return (tree: MdastNode, file?: File) => {
    visit(tree as never, DIRECTIVE_TYPES, (node) => {
      const directive = node as DirectiveNode;
      const name = directive.name ?? '';
      if (directive.type === 'textDirective') {
        const emoji = nameToEmoji[name];
        if (emoji) {
          toText(node, emoji);
          return;
        }
        toText(node, sliceSource(node, file) ?? literalMarker(directive));
        return;
      }
      if (directive.type === 'leafDirective') {
        toText(node, sliceSource(node, file) ?? literalMarker(directive));
        return;
      }
      const raw = sliceSource(node, file);
      if (raw !== undefined) {
        Object.assign(node, {
          type: 'paragraph',
          name: undefined,
          attributes: undefined,
          children: [{ type: 'text', value: raw }],
        });
      }
    });
  };
}
