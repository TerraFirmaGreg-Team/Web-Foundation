'use client';

import { useMemo, useState } from 'react';
import type { CrowdinLanguageProgress, CrowdinMember } from '../lib/members';
import { crowdinFlagLocale } from '../lib/languages';
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
import { LangFlag } from '@terrafirmagreg-team/ui/components/blocks/lang/flag';
import { Heading } from '@terrafirmagreg-team/ui/components/blocks/page/heading';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import {
  BadgeCheck,
  Crown,
  Globe,
  KeyRound,
  Languages,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const MAX_AVATARS = 20;
const PODIUM_COLORS = [
  'bg-amber-400 text-amber-950',
  'bg-slate-300 text-slate-700',
  'bg-amber-700 text-amber-50',
];

const ROLE_BADGE: Record<string, { icon: LucideIcon; className: string }> = {
  owner: { icon: KeyRound, className: 'fill-amber-500' },
  manager: { icon: ShieldCheck, className: 'fill-emerald-500' },
  developer: { icon: Wrench, className: 'fill-violet-500' },
  language_coordinator: { icon: Languages, className: 'fill-teal-500' },
  proofreader: { icon: BadgeCheck, className: 'fill-sky-500' },
};
const BASE_ROLES = new Set([
  'translator',
  'proofreader',
  'member',
  'blocked',
  'guest',
]);

const memberBadge = (roles: string[]) =>
  Object.keys(ROLE_BADGE).find((r) => roles.includes(r));

type LangLabel = (id: string) => string;

function MemberCard({
  member,
  label,
  sinceLabel,
  isNew,
  roleLabels,
  langName,
}: {
  member: CrowdinMember;
  label: string;
  sinceLabel: string | null;
  isNew: boolean;
  roleLabels: string[];
  langName: LangLabel;
}) {
  const t = useTranslations();
  return (
    <div className="flex gap-3">
      <Avatar className="size-11 shrink-0">
        <AvatarImage src={member.avatarUrl} alt="" />
        <AvatarFallback>
          {member.username.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {member.fullName ?? member.username}
          {isNew && (
            <span className="ml-1.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 align-middle text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              {t('new', { note: 'crowdin.new' })}
            </span>
          )}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          @{member.username}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {label}
          {sinceLabel && ` · ${sinceLabel}`}
        </p>
        {roleLabels.length > 0 && (
          <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
            {roleLabels.join(' · ')}
          </p>
        )}
        {member.languages.length > 0 && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground/80">
            {member.languages.map((l) => langName(l.id)).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}

function MemberAvatar({
  member,
  label,
  sinceLabel,
  isNew,
  roleLabels,
  langName,
  top,
}: {
  member: CrowdinMember;
  label: string;
  sinceLabel: string | null;
  isNew: boolean;
  roleLabels: string[];
  langName: LangLabel;
  top?: boolean;
}) {
  const badge = memberBadge(member.roles);
  const BadgeIcon = badge ? ROLE_BADGE[badge].icon : undefined;
  return (
    <HoverCard>
      <HoverCardTrigger
        render={
          <a
            href={`https://crowdin.com/profile/${member.username}`}
            target="_blank"
            rel="noreferrer noopener"
            className="relative block"
          />
        }
      >
        <Avatar>
          <AvatarImage
            src={member.avatarUrl}
            alt={member.fullName ?? member.username}
          />
          <AvatarFallback>
            {member.username.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {top && (
          <Crown className="absolute -top-1.5 -right-1 size-3.5 fill-amber-500 text-amber-500 drop-shadow" />
        )}
        {BadgeIcon && badge && (
          <BadgeIcon
            className={`absolute -bottom-1 -right-1 size-3.5 text-background ${ROLE_BADGE[badge].className}`}
          />
        )}
      </HoverCardTrigger>
      <HoverCardContent collisionPadding={8}>
        <MemberCard
          member={member}
          label={label}
          sinceLabel={sinceLabel}
          isNew={isNew}
          roleLabels={roleLabels}
          langName={langName}
        />
      </HoverCardContent>
    </HoverCard>
  );
}

export function MembersGrid({
  url,
  members,
  progress,
  languages,
}: {
  url: string;
  members: CrowdinMember[];
  progress?: Record<string, CrowdinLanguageProgress>;
  languages?: readonly string[];
}) {
  const t = useTranslations();
  const lang = useResolvedLang();
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());

  const langName = useMemo<LangLabel>(() => {
    const displayNames = new Intl.DisplayNames([lang.replace(/_/g, '-')], {
      type: 'language',
    });
    return (id) => {
      try {
        return displayNames.of(id) ?? id;
      } catch {
        return id;
      }
    };
  }, [lang]);

  const groups = useMemo(() => {
    const byLang = new Map<
      string,
      { id: string; name: string; members: CrowdinMember[] }
    >();
    for (const m of members)
      for (const l of m.languages) {
        const group = byLang.get(l.id) ?? {
          id: l.id,
          name: langName(l.id) || l.name,
          members: [],
        };
        group.members.push(m);
        byLang.set(l.id, group);
      }
    const allowed = languages?.length
      ? new Set(languages.map((code) => code.toLowerCase()))
      : undefined;
    return [...byLang.values()]
      .filter(
        (g) => !allowed || allowed.has(crowdinFlagLocale(g.id).toLowerCase()),
      )
      .sort((a, b) => {
      const pa = progress?.[a.id];
      const pb = progress?.[b.id];
      const diff =
        (pb?.translation ?? -1) - (pa?.translation ?? -1) ||
        (pb?.approval ?? -1) - (pa?.approval ?? -1) ||
        b.members.length - a.members.length;
      return diff || a.name.localeCompare(b.name);
      });
  }, [members, progress, langName, languages]);

  const totalWords = useMemo(
    () =>
      Object.values(progress ?? {}).reduce(
        (sum, p) => sum + p.words,
        members.reduce((sum, m) => sum + m.translated + m.approved, 0),
      ),
    [progress, members],
  );

  const compact = new Intl.NumberFormat(lang.replace(/_/g, '-'), {
    notation: 'compact',
  });

  const memberLabel = (m: CrowdinMember) =>
    t('{words} words', {
      note: 'crowdin.words',
      variables: { words: (m.translated + m.approved).toLocaleString() },
    });
  const memberSince = (m: CrowdinMember) =>
    m.joinedAt
      ? t('since {year}', {
          note: 'crowdin.since',
          variables: { year: String(new Date(m.joinedAt).getFullYear()) },
        })
      : null;
  const memberIsNew = (m: CrowdinMember) => m.isNew;
  const roleLabels = (m: CrowdinMember) =>
    m.roles
      .filter((r) => !BASE_ROLES.has(r))
      .map((r) => {
        switch (r) {
          case 'owner':
            return t('Owner', { note: 'crowdin.role.owner' });
          case 'manager':
            return t('Manager', { note: 'crowdin.role.manager' });
          case 'developer':
            return t('Developer', { note: 'crowdin.role.developer' });
          case 'language_coordinator':
            return t('Coordinator', { note: 'crowdin.role.coordinator' });
          case 'proofreader':
            return t('Proofreader', { note: 'crowdin.role.proofreader' });
          default:
            return r;
        }
      });

  const podium = members.slice(0, 3);

  return (
    <section className="not-prose mt-8 border-t pt-6">
      <Heading
        as="h2"
        id="translators"
        className="mb-3 text-2xl font-[650] tracking-tight"
      >
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="hover:underline"
        >
          {t('Translators', { note: 'crowdin.translators' })}
        </a>{' '}
        <span className="inline-flex items-center gap-1.5 align-middle text-base font-normal text-muted-foreground">
          {members.length}
          <Users className="size-4" />
          {groups.length > 0 &&
            `· ${t('{count} languages', {
              note: 'crowdin.languages',
              variables: { count: String(groups.length) },
            })}`}
          {totalWords > 0 &&
            ` · ${t('{words} words', {
              note: 'crowdin.words',
              variables: { words: compact.format(totalWords) },
            })}`}
        </span>
      </Heading>
      {podium.length >= 3 && (
        <div className="mb-6 flex items-end justify-center gap-5">
          {podium.map((m, i) => (
            <a
              key={m.username}
              href={`https://crowdin.com/profile/${m.username}`}
              target="_blank"
              rel="noreferrer noopener"
              className="group flex flex-col items-center gap-1.5"
            >
              <span className="relative">
                <Avatar
                  className={i === 0 ? 'size-14' : 'size-11'}
                >
                  <AvatarImage
                    src={m.avatarUrl}
                    alt={m.fullName ?? m.username}
                  />
                  <AvatarFallback>
                    {m.username.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={`absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${PODIUM_COLORS[i]}`}
                >
                  {i + 1}
                </span>
              </span>
              <span className="max-w-24 truncate text-xs font-medium group-hover:underline">
                {m.fullName ?? m.username}
              </span>
              <span className="-mt-1 text-[10px] text-muted-foreground">
                {compact.format(m.translated + m.approved)}
              </span>
            </a>
          ))}
        </div>
      )}
      {groups.length === 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {members.map((m) => (
            <li key={m.username}>
              <MemberAvatar
                member={m}
                label={memberLabel(m)}
                sinceLabel={memberSince(m)}
                isNew={memberIsNew(m)}
                roleLabels={roleLabels(m)}
                langName={langName}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => {
            const p = progress?.[group.id];
            const hidden =
              group.members.length > MAX_AVATARS && !expanded.has(group.id)
                ? group.members.length - MAX_AVATARS
                : 0;
            const shown = hidden
              ? group.members.slice(0, MAX_AVATARS)
              : group.members;
            return (
              <div key={group.id}>
                <h3 className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                  <LangFlag locale={crowdinFlagLocale(group.id)} />
                  <a
                    href={`${url}/${group.id}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="min-w-0 text-foreground hover:underline"
                  >
                    {group.name}
                  </a>
                  <span>{group.members.length}</span>
                  {p && (
                    <span className="ml-auto flex items-center gap-2">
                      <span
                        className="flex h-1.5 w-24 overflow-hidden rounded-full bg-foreground/15"
                        title={`${p.translation}% · ${t('{pct}% approved', {
                          note: 'crowdin.approved',
                          variables: { pct: String(p.approval) },
                        })}`}
                      >
                        <span
                          className="h-full bg-primary"
                          style={{ width: `${p.approval}%` }}
                        />
                        <span
                          className="h-full bg-primary/40"
                          style={{
                            width: `${Math.max(p.translation - p.approval, 0)}%`,
                          }}
                        />
                      </span>
                      <span className="w-9 text-right tabular-nums">
                        {p.translation}%
                      </span>
                    </span>
                  )}
                </h3>
                <ul className="flex flex-wrap gap-1.5">
                  {shown.map((m, i) => (
                    <li key={m.username}>
                      <MemberAvatar
                        member={m}
                        label={memberLabel(m)}
                        sinceLabel={memberSince(m)}
                        isNew={memberIsNew(m)}
                        roleLabels={roleLabels(m)}
                        langName={langName}
                        top={i === 0}
                      />
                    </li>
                  ))}
                  {hidden > 0 && (
                    <li>
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((prev) => new Set(prev).add(group.id))
                        }
                        className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        +{hidden}
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      )}
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Globe className="size-3.5" />
        {t('Help translate', { note: 'crowdin.join' })}
      </a>
    </section>
  );
}

export function MembersSkeleton() {
  return (
    <section className="not-prose mt-8 animate-pulse border-t pt-6">
      <div className="mb-4 h-4 w-48 rounded bg-muted" />
      <div className="mb-6 flex items-end gap-5">
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
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="mb-5">
          <div className="mb-2 flex items-center gap-2">
            <div className="size-4 rounded bg-muted" />
            <div className="h-3 w-24 rounded bg-muted" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 8 - row }).map((_, i) => (
              <div key={i} className="size-8 rounded-full bg-muted" />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
