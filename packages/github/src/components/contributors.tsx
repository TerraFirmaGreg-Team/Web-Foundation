import 'server-only';
import { Suspense } from 'react';
import { sectionConfig } from '@terrafirmagreg-team/kit/lib/config';
import type { SectionPageContext } from '@terrafirmagreg-team/kit/types/features';
import { repoContributors } from '../lib/contributors';
import { ContributorsGrid, ContributorsSkeleton } from './contributors-grid';

async function RepoContributorsList({ ctx }: { ctx: SectionPageContext }) {
  const dataset =
    ctx.datasetId && ctx.page.slugs.length === 2
      ? sectionConfig().datasetConfig[ctx.datasetId]
      : undefined;
  const repo = dataset?.github?.repo;
  const url =
    dataset?.github?.url ??
    (repo ? `https://github.com/${repo}` : undefined);
  const contributors = url
    ? await repoContributors(url, {
        excludeUsers: dataset?.github?.excludeUsers,
        minContributions: dataset?.github?.minContributions,
      })
    : undefined;
  if (!url || !contributors?.length) return null;
  return <ContributorsGrid url={url} contributors={contributors} />;
}

export function RepoContributors({ ctx }: { ctx: SectionPageContext }) {
  return (
    <Suspense fallback={<ContributorsSkeleton />}>
      <RepoContributorsList ctx={ctx} />
    </Suspense>
  );
}
