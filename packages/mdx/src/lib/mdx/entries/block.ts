import { createEntryRemark } from './factory.ts';

export const remarkBlockEntry = createEntryRemark({
  directive: 'block',
  component: 'BlockEntry',
});
