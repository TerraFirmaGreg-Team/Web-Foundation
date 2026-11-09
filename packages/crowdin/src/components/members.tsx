import 'server-only';
import { sectionConfig } from '@terrafirmagreg-team/kit/lib/config';
import type { SectionPageContext } from '@terrafirmagreg-team/kit/types/features';
import { crowdinMembers, crowdinProjectSlug } from '../lib/members';
import { MembersGrid } from './members-grid';

export async function CrowdinMembers({ ctx }: { ctx: SectionPageContext }) {
  const url =
    ctx.datasetId && ctx.page.slugs.length === 2
      ? sectionConfig().datasetConfig[ctx.datasetId]?.crowdin
      : undefined;
  const slug = crowdinProjectSlug(url);
  const members = slug ? await crowdinMembers(slug) : undefined;
  if (!url || !members?.length) return null;
  return <MembersGrid url={url} members={members} />;
}
