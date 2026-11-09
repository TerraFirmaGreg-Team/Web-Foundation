import 'server-only';
import { Suspense } from 'react';
import { sectionConfig } from '@terrafirmagreg-team/kit/lib/config';
import type { SectionPageContext } from '@terrafirmagreg-team/kit/types/features';
import {
  crowdinMembers,
  crowdinProgress,
  crowdinProjectSlug,
} from '../lib/members';
import { MembersGrid, MembersSkeleton } from './members-grid';

async function CrowdinMembersList({ ctx }: { ctx: SectionPageContext }) {
  const crowdin =
    ctx.datasetId && ctx.page.slugs.length === 2
      ? sectionConfig().datasetConfig[ctx.datasetId]?.crowdin
      : undefined;
  const slug = crowdinProjectSlug(crowdin?.url);
  const [members, progress] = slug
    ? await Promise.all([
        crowdinMembers(slug, {
          excludeUsers: crowdin?.excludeUsers,
          minWords: crowdin?.minWords,
        }),
        crowdinProgress(slug),
      ])
    : [undefined, undefined];
  if (!crowdin?.url || !members?.length) return null;
  return (
    <MembersGrid
      url={crowdin.url}
      members={members}
      progress={progress}
      languages={sectionConfig().languages}
    />
  );
}

export function CrowdinMembers({ ctx }: { ctx: SectionPageContext }) {
  return (
    <Suspense fallback={<MembersSkeleton />}>
      <CrowdinMembersList ctx={ctx} />
    </Suspense>
  );
}
