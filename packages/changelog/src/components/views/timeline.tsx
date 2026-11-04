import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { SectionSource } from '@terrafirmagreg-team/kit/lib/page';
import { timelineEntries } from '../entries';
import { ChangelogTimeline } from '../timeline';

export async function ChangelogTimelineView({
  source,
  route,
  dataset,
  lang,
  repo,
}: {
  source: SectionSource;
  route: string;
  dataset: string;
  lang: Lang;
  repo?: `${string}/${string}`;
}) {
  return (
    <ChangelogTimeline
      entries={await timelineEntries(source, route, dataset, lang, repo)}
      lang={lang}
    />
  );
}
