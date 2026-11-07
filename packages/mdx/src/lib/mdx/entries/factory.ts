import {
  contentChildren,
  extractDirectiveLabel,
  extractLeafLabel,
  estreeBoolean,
  estreeString,
  jsxAttr,
  jsxExpression,
  walkDirectives,
  type DirectiveNode,
  type JsxAttribute,
  type MdastNode,
} from '../directive-utils.ts';

export type EntrySpec = {
  directive: string;
  component: string;
  leafKey?: string;
  labelAttr?: string;
  usePagePack?: boolean;
  transform?: (ctx: {
    directive: DirectiveNode;
    attrs: JsxAttribute[];
    children: MdastNode[];
    isLeaf: boolean;
    file: { path?: string };
  }) => MdastNode[] | void;
};

function pageDataset(file: { path?: string }): string | undefined {
  return file.path
    ?.replaceAll('\\', '/')
    .match(/content\/docs\/([^/]+)\/[^/]+\//)?.[1];
}

export function toAttributes(directive: DirectiveNode): JsxAttribute[] {
  return Object.entries(directive.attributes ?? {}).map(([name, value]) => ({
    type: 'mdxJsxAttribute' as const,
    name,
    value:
      value == null || value === ''
        ? jsxExpression(estreeBoolean(true))
        : typeof value === 'string'
          ? value
          : jsxExpression(estreeString(String(value))),
  }));
}

export function createEntryRemark(spec: EntrySpec) {
  const {
    directive: name,
    component,
    leafKey = 'id',
    labelAttr = 'label',
    usePagePack = false,
    transform,
  } = spec;

  return function remark() {
    return (tree: MdastNode, file: { path?: string }) => {
      walkDirectives(tree, (directive) => {
        if (directive.name !== name) return;
        if (
          directive.type !== 'leafDirective' &&
          directive.type !== 'containerDirective'
        )
          return;

        const attrs = toAttributes(directive);
        const pack = usePagePack ? pageDataset(file) : undefined;
        if (
          pack &&
          directive.attributes?.pack == null &&
          directive.attributes?.defaultPack == null
        ) {
          attrs.push(jsxAttr('defaultPack', pack));
        }

        const isLeaf = directive.type === 'leafDirective';
        const label = (
          isLeaf
            ? extractLeafLabel(directive)
            : extractDirectiveLabel(directive)
        ).trim();
        const key = isLeaf ? leafKey : labelAttr;
        if (label && key) attrs.unshift(jsxAttr(key, label));

        const children = isLeaf ? [] : contentChildren(directive);
        const out =
          transform?.({ directive, attrs, children, isLeaf, file }) ??
          children;

        Object.assign(directive, {
          type: 'mdxJsxFlowElement',
          name: component,
          attributes: attrs,
          children: out,
        });
      });
    };
  };
}
