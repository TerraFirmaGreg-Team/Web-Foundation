import { jsxAttr, type MdastNode } from '../directive-utils.ts';
import { createEntryRemark } from './factory.ts';

export const remarkMultiblockEntry = createEntryRemark({
  directive: 'multiblock',
  component: 'Multiblock',
  transform({ directive, attrs, isLeaf }) {
    if (isLeaf) return;
    const code = directive.children?.find(
      (child) => child.type === 'code',
    ) as { value?: string } | undefined;
    if (!code?.value) return;
    attrs.unshift(jsxAttr('spec', code.value));
    return [] as MdastNode[];
  },
});
