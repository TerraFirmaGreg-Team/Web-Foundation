'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@terrafirmagreg-team/ui/components/ui/command';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { stackDisplayName } from '@terrafirmagreg-team/game/lib/entry/display';
import type { ReferenceKind } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';

export function CalcMemberList({
  tagId,
  members,
  selected,
  memberKind,
  dataset,
  lang,
  langMap,
  onSelect,
}: {
  tagId: string;
  members: string[];
  selected?: string;
  memberKind?: ReferenceKind;
  dataset: DatasetRef;
  lang: string;
  langMap?: Record<string, string>;
  onSelect: (tagId: string, memberId: string) => void;
}) {
  const t = useTranslations();
  return (
    <Command label={tagId}>
      <CommandInput placeholder={t('Search member…', { note: 'recipe.calc.member.search' })} />
      <CommandList>
        <CommandEmpty>{t('No results found', { note: 'recipe.search_empty' })}</CommandEmpty>
        <CommandGroup>
          {members.map((id) => (
            <CommandItem
              key={id}
              value={id}
              keywords={[stackDisplayName(langMap, id), id]}
              data-checked={id === selected}
              onSelect={() => onSelect(tagId, id)}
            >
              <Entry
                id={id}
                kind={memberKind}
                dataset={dataset}
                lang={lang}
                langMap={langMap}
                size="sm"
                labeled
                href={false}
                tooltip="adaptive"
              />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export function CalcMemberPicker({
  open,
  onOpenChange,
  tagId,
  members,
  selected,
  memberKind,
  dataset,
  lang,
  langMap,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tagId: string;
  members: string[];
  selected?: string;
  memberKind?: ReferenceKind;
  dataset: DatasetRef;
  lang: string;
  langMap?: Record<string, string>;
  onSelect: (tagId: string, memberId: string) => void;
}) {
  const t = useTranslations();
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('Choose tag member', { note: 'recipe.calc.member.title' })}
      description={tagId}
      className="sm:max-w-md"
      commandProps={{ label: tagId }}
    >
      <CalcMemberList
        tagId={tagId}
        members={members}
        selected={selected}
        memberKind={memberKind}
        dataset={dataset}
        lang={lang}
        langMap={langMap}
        onSelect={(id, member) => {
          onSelect(id, member);
          onOpenChange(false);
        }}
      />
    </CommandDialog>
  );
}

