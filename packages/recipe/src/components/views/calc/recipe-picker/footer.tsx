'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useState } from 'react';
import { ListFilter } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Button } from '@terrafirmagreg-team/ui/components/ui/button';
import { Hint } from '@terrafirmagreg-team/ui/components/blocks/tooltip/hint';
import { Checkbox } from '@terrafirmagreg-team/ui/components/ui/checkbox';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { formatCount } from '@terrafirmagreg-team/ui/lib/utils/format';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { CalcMemberList } from '@terrafirmagreg-team/recipe/components/views/calc/member-picker';
import type { CalcFlowData } from '@terrafirmagreg-team/recipe/lib/calc/flow';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export function PickerFooter({
  node,
  members,
  dataset,
  lang,
  langMap,
  recipeDefaults,
  onSetRecipeDefault,
  onSelectTagMember,
}: {
  node: CalcFlowData['node'];
  members: string[] | undefined;
  dataset: DatasetRef;
  lang: Lang;
  langMap?: Record<string, string>;
  recipeDefaults: CalcFlowData['recipeDefaults'];
  onSetRecipeDefault: CalcFlowData['onSetRecipeDefault'];
  onSelectTagMember: CalcFlowData['onSelectTagMember'];
}) {
  const t = useTranslations();
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  return (
    <>
      {members || node.recipe ? (
        <div className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5">
          {members ? (
            <>
              <Hint label={node.tagId!}>
                <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  #{node.tagId!.replace(/^#+/, '')}
                </span>
              </Hint>
              <Entry
                id={node.materialId}
                kind={node.kind}
                dataset={dataset}
                lang={lang}
                langMap={langMap}
                size="sm"
                labeled
                href={false}
                tooltip="adaptive"
                className="min-w-0 flex-1 justify-start"
              />
              <span className="shrink-0 tabular-nums text-[10px] text-muted-foreground">
                ×{formatCount(members.length)}
              </span>
              <Button
                size="xs"
                variant="outline"
                className="shrink-0"
                onClick={() => setMemberPickerOpen(true)}
              >
                <ListFilter className="size-3.5" />
                {t('Choose tag member', { note: 'recipe.calc.member.title' })}
              </Button>
            </>
          ) : null}
          {node.recipe ? (
            <label
              className={cn(
                'flex shrink-0 cursor-pointer select-none items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground',
                members ? 'ms-auto' : 'w-full',
              )}
            >
              <Checkbox
                checked={
                  recipeDefaults[node.materialId] === node.recipe.recipeId
                }
                onCheckedChange={(checked) =>
                  onSetRecipeDefault(
                    node.materialId,
                    checked ? node.recipe!.recipeId : null,
                  )
                }
              />
              {t('Pin as default recipe', { note: 'recipe.calc.set_default' })}
            </label>
          ) : null}
        </div>
      ) : null}
      {memberPickerOpen && members ? (
        <div
          className="absolute inset-0 z-20 flex items-start justify-center bg-background/70 p-4 pt-[12%]"
          onClick={() => setMemberPickerOpen(false)}
          onKeyDown={(event) => {
            if (event.key !== 'Escape') return;
            event.stopPropagation();
            setMemberPickerOpen(false);
          }}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-xl bg-popover shadow-lg ring-1 ring-foreground/10"
            onClick={(event) => event.stopPropagation()}
          >
            <CalcMemberList
              tagId={node.tagId!}
              members={members}
              selected={node.materialId}
              memberKind={node.kind}
              dataset={dataset}
              lang={lang}
              langMap={langMap}
              onSelect={(tagId, memberId) => {
                onSelectTagMember(tagId, memberId);
                setMemberPickerOpen(false);
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

