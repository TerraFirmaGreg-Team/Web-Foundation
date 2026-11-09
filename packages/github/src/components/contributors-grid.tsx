'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@terrafirmagreg-team/ui/components/ui/avatar';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@terrafirmagreg-team/ui/components/ui/hover-card';
import { Heading } from '@terrafirmagreg-team/ui/components/blocks/page/heading';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { Users } from 'lucide-react';
import type { RepoContributor } from '../lib/contributors';

const PODIUM_COLORS = [
  'bg-amber-400 text-amber-950',
  'bg-slate-300 text-slate-700',
  'bg-amber-700 text-amber-50',
];

const profileUrl = (contributor: RepoContributor) =>
  contributor.url || `https://github.com/${contributor.login}`;

function ContributorCard({
  contributor,
  label,
}: {
  contributor: RepoContributor;
  label: string;
}) {
  return (
    <div className="flex gap-3">
      <Avatar className="size-11 shrink-0">
        <AvatarImage src={contributor.avatarUrl} alt="" />
        <AvatarFallback>
          {contributor.login.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {contributor.type === 'Anonymous'
            ? contributor.login
            : `@${contributor.login}`}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function ContributorAvatar({
  contributor,
  label,
}: {
  contributor: RepoContributor;
  label: string;
}) {
  return (
    <HoverCard>
      <HoverCardTrigger
        render={
          <a
            href={profileUrl(contributor)}
            target="_blank"
            rel="noreferrer noopener"
            className="relative block"
          />
        }
      >
        <Avatar className="size-8">
          <AvatarImage src={contributor.avatarUrl} alt={contributor.login} />
          <AvatarFallback>
            {contributor.login.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </HoverCardTrigger>
      <HoverCardContent collisionPadding={8}>
        <ContributorCard contributor={contributor} label={label} />
      </HoverCardContent>
    </HoverCard>
  );
}

export function ContributorsGrid({
  url,
  contributors,
}: {
  url: string;
  contributors: RepoContributor[];
}) {
  const t = useTranslations();
  const lang = useResolvedLang();
  const compact = new Intl.NumberFormat(lang.replace(/_/g, '-'), {
    notation: 'compact',
  });
  const label = (c: RepoContributor) =>
    t('{count} commits', {
      note: 'github.commits',
      variables: { count: c.contributions.toLocaleString() },
    });
  const podium = contributors.slice(0, 3);

  return (
    <section className="not-prose mt-8 border-t pt-6">
      <Heading
        as="h2"
        id="contributors"
        className="mb-3 text-2xl font-[650] tracking-tight"
      >
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="hover:underline"
        >
          {t('Contributors', { note: 'github.contributors' })}
        </a>{' '}
        <span className="inline-flex items-center gap-1.5 align-middle text-base font-normal text-muted-foreground">
          {contributors.length}
          <Users className="size-4" />
        </span>
      </Heading>
      {podium.length >= 3 && (
        <div className="mb-6 flex items-end justify-center gap-5">
          {podium.map((c, i) => (
            <a
              key={c.login}
              href={profileUrl(c)}
              target="_blank"
              rel="noreferrer noopener"
              className="group flex flex-col items-center gap-1.5"
            >
              <span className="relative">
                <Avatar className={i === 0 ? 'size-14' : 'size-11'}>
                  <AvatarImage src={c.avatarUrl} alt={c.login} />
                  <AvatarFallback>
                    {c.login.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={`absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${PODIUM_COLORS[i]}`}
                >
                  {i + 1}
                </span>
              </span>
              <span className="max-w-24 truncate text-xs font-medium group-hover:underline">
                {c.login}
              </span>
              <span className="-mt-1 text-[10px] text-muted-foreground">
                {compact.format(c.contributions)}
              </span>
            </a>
          ))}
        </div>
      )}
      <ul className="flex flex-wrap gap-1.5">
        {contributors.map((c) => (
          <li key={c.login}>
            <ContributorAvatar contributor={c} label={label(c)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ContributorsSkeleton() {
  return (
    <section className="not-prose mt-8 animate-pulse border-t pt-6">
      <div className="mb-4 h-4 w-48 rounded bg-muted" />
      <div className="mb-6 flex items-end justify-center gap-5">
        {[14, 11, 11].map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div
              className="rounded-full bg-muted"
              style={{ width: s * 4, height: s * 4 }}
            />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="size-8 rounded-full bg-muted" />
        ))}
      </div>
    </section>
  );
}
