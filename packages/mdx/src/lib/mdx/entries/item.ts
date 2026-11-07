import { createEntryRemark } from './factory.ts';

export const remarkItemEntry = createEntryRemark({
  directive: 'item',
  component: 'ItemEntry',
});
