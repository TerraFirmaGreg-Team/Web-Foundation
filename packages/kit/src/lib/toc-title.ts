import {
  Children,
  cloneElement,
  createElement,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';

function unwrap(node: ReactNode): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement(child)) return child;
    const element = child as ReactElement<{
      href?: unknown;
      children?: ReactNode;
    }>;
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
