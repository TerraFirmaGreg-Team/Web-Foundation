import { visit, CONTINUE } from 'unist-util-visit';
import {
  contentChildren,
  toJsxAttributes,
  type DirectiveNode,
  type MdastNode,
} from './directive-utils.ts';

const CALLOUT_TYPES: Record<string, string> = {
  note: 'note',
  tip: 'tip',
  tips: 'tip',
  hint: 'tip',
  info: 'info',
  important: 'important',
  warn: 'warning',
  warning: 'warning',
  caution: 'caution',
  attention: 'attention',
  danger: 'danger',
  error: 'error',
  success: 'success',
  idea: 'idea',
  question: 'question',
  help: 'question',
  faq: 'question',
  failure: 'failure',
  fail: 'failure',
  missing: 'failure',
  bug: 'bug',
  abstract: 'abstract',
  summary: 'abstract',
  tldr: 'abstract',
  example: 'example',
  quote: 'quote',
  cite: 'quote',
};

const ALERT_RE = /^\[!([^\]\s]+)\][ \t]*/;

function calloutKind(name: string | undefined): string | undefined {
  return name ? CALLOUT_TYPES[name.toLowerCase()] : undefined;
}

function calloutChildren(
  type: string,
  titleNodes: MdastNode[],
  bodyNodes: MdastNode[],
): MdastNode[] {
  const children: MdastNode[] = [];
  const title =
    titleNodes.length
      ? titleNodes
      : [
          {
            type: 'text',
            value: type[0].toUpperCase() + type.slice(1),
          } as MdastNode,
        ];
  children.push({
    type: 'mdxJsxFlowElement',
    name: 'CalloutTitle',
    attributes: [],
    children: title,
  } as MdastNode);
  if (bodyNodes.length) {
    children.push({
      type: 'mdxJsxFlowElement',
      name: 'CalloutDescription',
      attributes: [],
      children: bodyNodes,
    } as MdastNode);
  }
  return children;
}

function directiveLabelNodes(node: DirectiveNode): MdastNode[] {
  for (const child of node.children ?? []) {
    if (child.type === 'paragraph' && child.data?.directiveLabel) {
      return (child.children ?? []) as MdastNode[];
    }
  }
  return [];
}

function convertAlert(container: MdastNode): boolean {
  const first = container.children?.[0];
  if (first?.type !== 'paragraph') return false;
  const text = first.children?.[0];
  if (text?.type !== 'text' || typeof text.value !== 'string') return false;
  const match = ALERT_RE.exec(text.value);
  if (!match) return false;
  const type = calloutKind(match[1]);
  if (!type) return false;

  text.value = text.value.slice(match[0].length);
  const inline = first.children ?? [];
  if (!text.value) {
    inline.shift();
    if (inline[0]?.type === 'break') inline.shift();
  }

  const body: MdastNode[] = [
    ...(inline.length
      ? [{ type: 'paragraph', children: [...inline] } as MdastNode]
      : []),
    ...((container.children ?? []).slice(1) as MdastNode[]),
  ];
  const callout = {
    type: 'mdxJsxFlowElement',
    name: 'CalloutContainer',
    attributes: [
      { type: 'mdxJsxAttribute', name: 'type', value: type },
    ],
    children: calloutChildren(type, [], body),
  };
  Object.assign(
    container.type === 'listItem' ? first : container,
    callout,
  );
  return true;
}

export function remarkCallouts() {
  return (tree: MdastNode) => {
    visit(
      tree as never,
      ['containerDirective', 'blockquote', 'listItem'],
      (node) => {
        const item = node as DirectiveNode;
        if (item.type === 'containerDirective') {
          const type = calloutKind(item.name);
          if (!type) return CONTINUE;
          Object.assign(item, {
            type: 'mdxJsxFlowElement',
            name: 'CalloutContainer',
            attributes: [
              { type: 'mdxJsxAttribute', name: 'type', value: type },
              ...toJsxAttributes(item),
            ],
            children: calloutChildren(
              type,
              directiveLabelNodes(item),
              contentChildren(item),
            ),
          });
        } else {
          convertAlert(item);
        }
      },
    );
  };
}
