'use client';

import type { CrowdinMember } from '../lib/members';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@terrafirmagreg-team/ui/components/ui/avatar';
import { Hint } from '@terrafirmagreg-team/ui/components/blocks/tooltip/hint';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Users } from 'lucide-react';

export function MembersGrid({
  url,
  members,
}: {
  url: string;
  members: CrowdinMember[];
}) {
  const t = useTranslations();
  return (
    <section className="not-prose mt-8 border-t pt-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Users className="size-4" />
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="hover:text-foreground hover:underline"
        >
          {t('Translators', { note: 'crowdin.translators' })}
        </a>
      </h2>
      <ul className="flex flex-wrap gap-1.5">
        {members.map((m) => (
          <li key={m.username}>
            <Hint label={m.fullName ?? m.username}>
              <a
                href={`https://crowdin.com/profile/${m.username}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                <Avatar>
                  <AvatarImage
                    src={m.avatarUrl}
                    alt={m.fullName ?? m.username}
                  />
                  <AvatarFallback>
                    {m.username.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </a>
            </Hint>
          </li>
        ))}
      </ul>
    </section>
  );
}
