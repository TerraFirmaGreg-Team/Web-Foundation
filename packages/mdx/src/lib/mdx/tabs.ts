import {
  extractLeafLabel,
  jsxExpression,
  toJsxAttributes,
  walkContainers,
  type DirectiveNode,
  type JsxElement,
  type MdastNode,
} from './directive-utils.ts';

export function remarkTabs() {
  return (tree: MdastNode) => {
    walkContainers(tree, (directive) => {
      if (directive.name !== 'tabs') return;
      toTabs(directive);
    });
  };
}

function escapeValue(value: string): string {
  return value.toLowerCase().replace(/\s/g, '-');
}

function toTabs(node: DirectiveNode): void {
  const items: string[] = [];
  const tabs: JsxElement[] = [];
  let current: JsxElement | undefined;

  for (const item of node.children ?? []) {
    if (item.type === 'leafDirective' && (item as { name?: string }).name === 'tab') {
      const label = extractLeafLabel(item);
      items.push(label);
      current = {
        type: 'mdxJsxFlowElement',
        name: 'Tab',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'value',
            value: escapeValue(label),
          },
        ],
        children: [],
      };
      tabs.push(current);
      continue;
    }

    current?.children.push(item);
  }

  const attributes = toJsxAttributes(node).map((attribute) =>
    attribute.name === 'default' && typeof attribute.value === 'string'
      ? {
          type: 'mdxJsxAttribute' as const,
          name: 'defaultValue',
          value: escapeValue(attribute.value),
        }
      : attribute,
  );
  attributes.unshift({
    type: 'mdxJsxAttribute',
    name: 'items',
    value: jsxExpression(items),
  });

  Object.assign(node, {
    type: 'mdxJsxFlowElement',
    name: 'Tabs',
    attributes,
    children: tabs,
  });
}

