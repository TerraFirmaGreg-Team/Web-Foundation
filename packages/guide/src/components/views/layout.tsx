import { Layout } from '@terrafirmagreg-team/kit/components/layouts/layout';
import type { SectionLayoutViewProps } from '@terrafirmagreg-team/kit/components/views/routes';
import { GuideBookSwitcher } from '@terrafirmagreg-team/guide/components/book-switcher';
import { useGuideLeftSidebarTree } from '@terrafirmagreg-team/guide/hooks/use-left-sidebar-tree';

export function GuideLayout(props: SectionLayoutViewProps) {
  return (
    <Layout
      {...props}
      useTree={useGuideLeftSidebarTree}
      sidebar={{ feature: GuideBookSwitcher }}
    />
  );
}
