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
} from './directive-utils.ts';

const COMPONENTS: Record<string, string> = {
  item: 'ItemEntry',
  block: 'BlockEntry',
  fluid: 'FluidEntry',
  entity: 'EntityEntry',
  tag: 'TagEntry',
  quest: 'QuestEntry',
  guide: 'GuideEntry',
  multiblock: 'Multiblock',
  image: 'DocsImage',
  story: 'Story',
};

const LEAF_KEY: Record<string, string> = {
  image: 'src',
  story: 'name',
};

const LABEL_ATTR: Record<string, string> = {
  image: 'alt',
};

function pageDataset(file: { path?: string }): string | undefined {
  return file.path
    ?.replaceAll('\\', '/')
    .match(/content\/docs\/([^/]+)\/[^/]+\//)?.[1];
}

export function remarkGameExport() {
  return (tree: MdastNode, file: { path?: string }) => {
    const pack = pageDataset(file);
    walkDirectives(tree, (directive) => {
      const name = directive.name ?? '';
      const component = COMPONENTS[name];
      if (!component) return;
      if (
        directive.type !== 'leafDirective' &&
        directive.type !== 'containerDirective'
      )
        return;

      const attrs = toAttributes(directive);
      if (
        name === 'image' &&
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
      const labelAttr = isLeaf
        ? (LEAF_KEY[name] ?? 'id')
        : (LABEL_ATTR[name] ?? 'label');
      if (label && labelAttr) attrs.unshift(jsxAttr(labelAttr, label));

      let children = isLeaf ? [] : contentChildren(directive);
      if (name === 'multiblock' && !isLeaf) {
        const code = directive.children?.find(
          (child) => child.type === 'code',
        ) as { value?: string } | undefined;
        if (code?.value) {
          attrs.unshift(jsxAttr('spec', code.value));
          children = [];
        }
      }

      Object.assign(directive, {
        type: 'mdxJsxFlowElement',
        name: component,
        attributes: attrs,
        children,
      });
      return false;
    });
  };
}

function toAttributes(directive: DirectiveNode): JsxAttribute[] {
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

