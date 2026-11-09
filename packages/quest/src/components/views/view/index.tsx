'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { ReactNode } from 'react';

import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { langString } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { guideHref } from '@terrafirmagreg-team/game/lib/entry/href';
import { questHref } from '@terrafirmagreg-team/quest/lib/links';
import {
  parseGuidePageRef,
  questDisplayTitle,
  questTaskIconRefs,
} from '@terrafirmagreg-team/quest/lib/display';
import {
  compactDependents,
  compactPrereqs,
} from '@terrafirmagreg-team/quest/lib/data/parse';
import type { Quest, QuestCompactIndex } from '@terrafirmagreg-team/quest/lib/data/dto';
import {
  parseQuestDescription,
  parseRichText,
} from '@terrafirmagreg-team/quest/lib/rich-text';
import { renderQuestNodes } from '@terrafirmagreg-team/quest/components/rich-text';
import { DescriptionBlocks } from '@terrafirmagreg-team/quest/components/views/view/description-blocks';
import { CommentsSlot } from '@terrafirmagreg-team/discussions/components/comments';
import { TaskChips } from '@terrafirmagreg-team/quest/components/views/view/task-chips';
import { RewardBlock } from '@terrafirmagreg-team/quest/components/views/view/reward-block';
import { visibleRewards } from '@terrafirmagreg-team/quest/lib/display';
import { NavList } from '@terrafirmagreg-team/quest/components/views/view/nav-list';
import { ItemRow } from '@terrafirmagreg-team/ui/components/blocks/list/row';
import {
  Field,
  FieldContent,
  FieldLabel,
} from '@terrafirmagreg-team/ui/components/ui/field';
import { ScrollArea } from '@terrafirmagreg-team/ui/components/ui/scroll-area';
import { LinkPreview } from '@terrafirmagreg-team/ui/components/blocks/link/link-preview';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export function QuestView({
  quest,
  dataset,
  lang,
  langMap,
  index,
  chapterJump,
  actionsRight,
}: {
  quest: Quest;
  dataset: DatasetRef;
  lang: Lang;
  langMap: Record<string, string>;
  index?: QuestCompactIndex | null;
  chapterJump?: { filename: string; title?: string };
  actionsRight?: ReactNode;
}) {
  const t = useTranslations();
  const title = questDisplayTitle(quest, langMap);
  const icon = questTaskIconRefs(quest)[0];
  const subtitle = quest.subtitle
    ? parseRichText(quest.subtitle, langMap)
    : [];
  const description = parseQuestDescription(quest.description, langMap);
  const compact = index ?? { groups: [], chapters: [], quests: [] };
  const prereqs = compactPrereqs(quest.dependencies, compact);
  const dependents = compactDependents(quest.id, compact);
  const guide = quest.guidePage ? parseGuidePageRef(quest.guidePage) : undefined;
  const guideLabel =
    (index?.openGuide ? langString(langMap, index.openGuide) : undefined) ??
    t('Open in guide', { note: 'quest.guide' });
  const requiredTasks = quest.tasks.filter((task) => !task.optional);
  const optionalTasks = quest.tasks.filter((task) => task.optional);

  return (
    <ScrollArea className="not-prose h-full">
      <div className="flex min-h-full flex-col gap-3 py-4 pe-4">
        <ItemRow
          layout="header"
          align="start"
          media={
            icon ? (
              <Entry
                reference={icon}
                name={title}
                size="lg"
                href={false}
                tooltip={false}
                missing={icon.kind === 'texture' ? 'placeholder' : 'hide'}
              />
            ) : null
          }
          title={renderQuestNodes(parseRichText(title, langMap), {
            dataset,
            lang,
            index: compact,
          })}
          titleClassName="text-base"
          trailing={actionsRight}
          description={
            subtitle.length || quest.optional ? (
              <>
                {subtitle.length
                  ? renderQuestNodes(subtitle, {
                      dataset,
                      lang,
                      index: compact,
                    })
                  : null}
                {quest.optional ? (
                  <p className="text-xs">{t('Optional', { note: 'quest.optional' })}</p>
                ) : null}
              </>
            ) : undefined
          }
        />
        <DescriptionBlocks
          blocks={description}
          dataset={dataset}
          lang={lang}
          index={compact}
        />
        {guide ? (
          <p>
            <LinkPreview
              variant="text"
              href={guideHref(
                dataset,
                lang,
                `${guide.modId}:${guide.bookPath}`,
                guide.entry,
              )}
              className="text-sm"
            >
              {guideLabel}
            </LinkPreview>
          </p>
        ) : null}
        {chapterJump ? (
          <p>
            <LinkPreview
              variant="text"
              href={questHref(dataset, lang, {
                category: chapterJump.filename,
                id: quest.id,
              })}
              className="text-sm"
            >
              {chapterJump.title ?? chapterJump.filename}
            </LinkPreview>
          </p>
        ) : null}
        {quest.tasks.length ? (
          <div>
            <FieldLabel className="mb-1">{t('Tasks', { note: 'quest.tasks' })}</FieldLabel>
            <div className="flex flex-col gap-2">
              {requiredTasks.length ? (
                <div className="flex flex-wrap items-center gap-1">
                  {requiredTasks.map((task) => (
                    <TaskChips
                      key={task.id}
                      langMap={langMap}
                      task={task}
                      fallbackIcon={icon}
                    />
                  ))}
                </div>
              ) : null}
              {optionalTasks.length ? (
                <div>
                  <FieldLabel className="mb-1">
                    {t('Optional', { note: 'quest.optional' })}
                  </FieldLabel>
                  <div className="flex flex-wrap items-center gap-1">
                    {optionalTasks.map((task) => (
                      <TaskChips
                        key={task.id}
                        langMap={langMap}
                        task={task}
                        fallbackIcon={icon}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        {quest.rewards.length ? (
          <Field>
            <FieldLabel>{t('Rewards', { note: 'quest.rewards' })}</FieldLabel>
            <FieldContent>
              <div className="flex flex-wrap items-center gap-1">
                {visibleRewards(quest.rewards, langMap).map((reward) => (
                  <RewardBlock key={reward.id} langMap={langMap} reward={reward} />
                ))}
              </div>
            </FieldContent>
          </Field>
        ) : null}
        <Field>
          <FieldLabel>{t('Prerequisites', { note: 'quest.prerequisites' })}</FieldLabel>
          <FieldContent>
            {quest.invisible ? (
              <p className="text-xs text-muted-foreground">
                {t('Prerequisites are hidden.', { note: 'quest.prerequisites_hidden' })}
              </p>
            ) : (
              <NavList
                rows={prereqs}
                dataset={dataset}
                lang={lang}
                langMap={langMap}
                empty={t('None', { note: 'quest.none' })}
              />
            )}
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel>{t('Unlocks', { note: 'quest.dependents' })}</FieldLabel>
          <FieldContent>
            <NavList
              rows={dependents}
              dataset={dataset}
              lang={lang}
              langMap={langMap}
              empty={t('None', { note: 'quest.none' })}
            />
          </FieldContent>
        </Field>
        <div className="mt-auto">
          <CommentsSlot page={`quest:${dataset.id}:${quest.id}#${lang}`} />
        </div>
      </div>
    </ScrollArea>
  );
}

