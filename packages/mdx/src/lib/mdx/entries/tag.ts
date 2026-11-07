import { createEntryRemark } from './factory.ts';

export const remarkTagEntry = createEntryRemark({
  directive: 'tag',
  component: 'TagEntry',
});
