import {
  Children,
  cloneElement,
  createElement,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';

function isPresentation(element: ReactElement): boolean {
  const props = element.props as Record<string, unknown>;
  if (props['data-md'] !== undefined) return true;
  const type = element.type as { mdPresentation?: boolean } | string;
  return typeof type !== 'string' && type.mdPresentation === true;
}

function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number')
        return String(child);
      if (isValidElement(child)) {
        const element = child as ReactElement<{ children?: ReactNode }>;
        return textOf(element.props.children);
      }
      return '';
    })
    .join('');
}

function unwrap(node: ReactNode): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement(child)) return child;
    const element = child as ReactElement<{
      href?: unknown;
      children?: ReactNode;
    }>;
    if (isPresentation(element)) return textOf(element.props.children);
    if (element.props.href !== undefined) {
      return unwrap(element.props.children);
    }
    if (element.props.children !== undefined) {
      return cloneElement(
        element,
        undefined,
        unwrap(element.props.children),
      );
    }
    return child;
  });
}

export function tocTitle(item: { title: ReactNode }): ReactNode {
  return createElement(Fragment, null, unwrap(item.title));
}
