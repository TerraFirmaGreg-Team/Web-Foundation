import { Layout } from '@terrafirmagreg-team/kit/components/layouts/layout';
import type { SectionLayoutViewProps } from '@terrafirmagreg-team/kit/components/views/routes';
import { RecipeAxisSwitcher } from '@terrafirmagreg-team/recipe/components/views/browser/axis-switcher';
import { useRecipeLeftSidebarTree } from '@terrafirmagreg-team/recipe/hooks/use-left-sidebar-tree';

export function RecipeLayout(props: SectionLayoutViewProps) {
  return (
    <Layout
      {...props}
      useTree={useRecipeLeftSidebarTree}
      sidebar={{ feature: RecipeAxisSwitcher }}
    />
  );
}
