import { createEntryRemark } from './factory.ts';

export const remarkStoryEntry = createEntryRemark({
  directive: 'story',
  component: 'Story', leafKey: 'name',
});
