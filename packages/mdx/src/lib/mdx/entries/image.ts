import { createEntryRemark } from './factory.ts';

export const remarkImageEntry = createEntryRemark({
  directive: 'image',
  component: 'DocsImage',
  leafKey: 'src',
  labelAttr: 'alt',
  usePagePack: true,
});
