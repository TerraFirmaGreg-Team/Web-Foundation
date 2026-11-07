import { createEntryRemark } from './factory.ts';

export const remarkEntityEntry = createEntryRemark({
  directive: 'entity',
  component: 'EntityEntry',
});
