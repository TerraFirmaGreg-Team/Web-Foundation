import {
  jsxAttrValue,
  jsxExpression,
  walkContainers,
  type DirectiveNode,
  type MdastNode,
} from './directive-utils.ts';

export function remarkBanner() {
  return (tree: MdastNode) => {
    walkContainers(tree, (directive) => {
      if (directive.name !== 'banner') return;
      Object.assign(directive, {
        type: 'mdxJsxFlowElement',
        name: 'Banner',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'changeLayout',
            value: jsxExpression(false),
          },
          ...toAttributes(directive),
        ],
        children: directive.children,
      });
    });
  };
}

function toAttributes(directive: DirectiveNode) {
  return Object.entries(directive.attributes ?? {})
    .filter(([name]) => name !== 'id')
    .map(([name, value]) => {
      if (name === 'rainbowColors' && typeof value === 'string') {
        const colors = value
          .split(',')
          .map((color) => color.trim())
          .filter(Boolean);
        return {
          type: 'mdxJsxAttribute' as const,
          name,
          value: jsxExpression(colors),
        };
      }
      return {
        type: 'mdxJsxAttribute' as const,
        name,
        value: jsxAttrValue(value),
      };
    });
}

