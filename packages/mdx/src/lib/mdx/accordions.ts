import {
  contentChildren,
  extractDirectiveLabel,
  extractLeafLabel,
  jsxAttr,
  jsxAttrValue,
  jsxExpression,
  walkContainers,
  type DirectiveNode,
  type JsxAttribute,
  type JsxElement,
  type MdastNode,
} from './directive-utils.ts';

export function remarkAccordions() {
  return (tree: MdastNode) => {
    walkContainers(tree, (directive) => {
      if (directive.name === 'accordion' || directive.name === 'details') {
        wrapSingle(directive);
      }
      if (directive.name === 'accordions') {
        toAccordions(directive);
      }
    });
  };
}

function toAccordion(node: DirectiveNode): JsxElement {
  return {
    type: 'mdxJsxFlowElement',
    name: 'Accordion',
    attributes: [jsxAttr('title', extractDirectiveLabel(node))],
    children: contentChildren(node),
  };
}

function wrapSingle(node: DirectiveNode): void {
  const attrs = node.attributes ?? {};
  const open = 'open' in attrs;
  Object.assign(node, {
    type: 'mdxJsxFlowElement',
    name: 'Accordions',
    attributes: open
      ? [
          {
            type: 'mdxJsxAttribute',
            name: 'defaultValue',
            value: jsxExpression([extractDirectiveLabel(node)]),
          } as JsxAttribute,
        ]
      : [],
    children: [toAccordion(node)],
  });
}

function accordionsAttributes(node: DirectiveNode): JsxAttribute[] {
  const attrs = node.attributes ?? {};
  const out: JsxAttribute[] = [];
  const isMultiple =
    attrs.multiple === true ||
    attrs.multiple === '' ||
    attrs.type === 'multiple';

  if (isMultiple) out.push(jsxAttr('multiple', true));

  for (const [name, value] of Object.entries(attrs)) {
    if (name === 'type' || name === 'multiple') continue;
    out.push({
      type: 'mdxJsxAttribute',
      name,
      value: jsxAttrValue(value),
    });
  }

  return out;
}

function toAccordions(node: DirectiveNode): void {
  const items: JsxElement[] = [];
  let current: JsxElement | undefined;

  for (const item of node.children ?? []) {
    if (
      item.type === 'leafDirective' &&
      (item as { name?: string }).name === 'accordion'
    ) {
      current = {
        type: 'mdxJsxFlowElement',
        name: 'Accordion',
        attributes: [jsxAttr('title', extractLeafLabel(item))],
        children: [],
      };
      items.push(current);
      continue;
    }

    current?.children.push(item);
  }

  Object.assign(node, {
    type: 'mdxJsxFlowElement',
    name: 'Accordions',
    attributes: accordionsAttributes(node),
    children: items,
  });
}

