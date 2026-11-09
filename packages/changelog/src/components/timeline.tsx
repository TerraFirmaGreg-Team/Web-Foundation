import Link from 'next/link';
import { ExternalLink, Link as LinkIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { dayFormat, monthLabel } from '@terrafirmagreg-team/changelog/lib/format';
import { ChangelogNow } from './now-bar';
import { TrackRelease } from './track-release';

export interface ChangelogTimelineEntry {
  id: string;
  title: string;
  date: Date;
  url?: string;
  releaseUrl?: string;
  untranslated?: boolean;
  body: ReactNode;
}

export type ChangelogMonth = {
  key: string;
  label: string;
  items: ChangelogTimelineEntry[];
};

export function groupByMonth(
  entries: ChangelogTimelineEntry[],
  lang = 'en_us',
): ChangelogMonth[] {
  const months = new Map<string, ChangelogMonth>();
  for (const entry of [...entries].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  )) {
    const key = `${entry.date.getUTCFullYear()}-${String(entry.date.getUTCMonth() + 1).padStart(2, '0')}`;
    const month = months.get(key);
    if (month) month.items.push(entry);
    else
      months.set(key, {
        key,
        label: monthLabel(lang, entry.date),
        items: [entry],
      });
  }
  return [...months.values()];
}

export const monthAnchor = (monthKey: string) => monthKey;

export function ChangelogTimeline({
  entries,
  lang = 'en_us',
}: {
  entries: ChangelogTimelineEntry[];
  lang?: string;
}) {
  const day = dayFormat(lang);
  const latestId = entries.length
    ? entries.reduce((a, b) => (b.date > a.date ? b : a)).id
    : undefined;
  const months = groupByMonth(entries, lang);
  return (
    <div data-changelog-timeline>
      <ChangelogNow
        items={months.flatMap((month) =>
          month.items.map((entry) => ({
            id: entry.id,
            untranslated: entry.untranslated,
          })),
        )}
      />
      {months.map(({ key, label, items }) => (
        <section
          key={key}
          className="ms-3 border-s-2 border-muted-foreground/25 ps-6 pb-8"
        >
          <h2
            id={monthAnchor(key)}
            className="not-prose scroll-mt-28 py-2 text-[11px] font-semibold tracking-[0.05em] text-muted-foreground/60"
          >
            {label}
          </h2>
          <ol className="mt-4 mb-0 list-none ps-0">
            {items.map((entry) => (
              <ChangelogItem
                key={entry.id}
                entry={entry}
                day={day}
                latest={entry.id === latestId}
              />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function ChangelogItem({
  entry,
  day,
  latest,
}: {
  entry: ChangelogTimelineEntry;
  day: Intl.DateTimeFormat;
  latest?: boolean;
}) {
  return (
    <li
      id={entry.id}
      data-release
      className="group scroll-mt-28 ps-0 pb-12 last:pb-0"
    >
      <TrackRelease path={entry.url} />
      <time
        dateTime={entry.date.toISOString()}
        className="relative mb-1.5 block text-xs font-medium text-muted-foreground tabular-nums"
      >
        <span className="absolute -start-[25px] top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background rtl:translate-x-1/2" />
        {day.format(entry.date)}
      </time>
      <h3 className="not-prose mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight">
        {latest && (
          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Latest
          </span>
        )}
        {entry.url ? (
          <Link
            href={entry.url}
            className="underline-offset-4 hover:text-primary hover:underline"
          >
            {entry.title}
          </Link>
        ) : (
          entry.title
        )}
        {entry.releaseUrl && (
          <a
            href={entry.releaseUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub release"
            className="text-muted-foreground hover:text-primary"
          >
            <ExternalLink className="size-3.5" />
          </a>
        )}
        <a
          href={`#${entry.id}`}
          aria-label="Link to this release"
          className="text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
        >
          <LinkIcon className="size-3.5" />
        </a>
      </h3>
      <div className="text-sm text-muted-foreground">{entry.body}</div>
    </li>
  );
}
