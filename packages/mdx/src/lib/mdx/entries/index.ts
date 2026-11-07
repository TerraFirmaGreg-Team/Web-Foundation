import type { MdastNode } from '../directive-utils.ts';
import { remarkBlockEntry } from './block.ts';
import { remarkEntityEntry } from './entity.ts';
import { remarkFluidEntry } from './fluid.ts';
import { remarkGuideEntry } from './guide.ts';
import { remarkImageEntry } from './image.ts';
import { remarkItemEntry } from './item.ts';
import { remarkMultiblockEntry } from './multiblock.ts';
import { remarkQuestEntry } from './quest.ts';
import { remarkRecipeEntry } from './recipe.ts';
import { remarkStoryEntry } from './story.ts';
import { remarkTagEntry } from './tag.ts';

export { remarkBlockEntry } from './block.ts';
export { remarkEntityEntry } from './entity.ts';
export { remarkFluidEntry } from './fluid.ts';
export { remarkGuideEntry } from './guide.ts';
export { remarkImageEntry } from './image.ts';
export { remarkItemEntry } from './item.ts';
export { remarkMultiblockEntry } from './multiblock.ts';
export { remarkQuestEntry } from './quest.ts';
export { remarkRecipeEntry } from './recipe.ts';
export { remarkStoryEntry } from './story.ts';
export { remarkTagEntry } from './tag.ts';

const ALL = [
  remarkItemEntry,
  remarkBlockEntry,
  remarkFluidEntry,
  remarkEntityEntry,
  remarkTagEntry,
  remarkQuestEntry,
  remarkGuideEntry,
  remarkMultiblockEntry,
  remarkImageEntry,
  remarkStoryEntry,
  remarkRecipeEntry,
];

export function remarkEntries() {
  const plugins = ALL.map((factory) => factory());
  return (tree: MdastNode, file: { path?: string }) => {
    for (const plugin of plugins) plugin(tree, file);
  };
}
