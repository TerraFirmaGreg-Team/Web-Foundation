'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { EmptyState } from '@terrafirmagreg-team/ui/components/blocks/page/empty-state';
import { LinkPreview } from '@terrafirmagreg-team/ui/components/blocks/link/link-preview';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import { tagPseudoId } from '@terrafirmagreg-team/dump/lib/dump/paths';
import { recipeHref } from '@terrafirmagreg-team/recipe/lib/links';
import { replaceUrlState } from '@terrafirmagreg-team/ui/lib/utils/history';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { RecipeHrefOpts } from '@terrafirmagreg-team/recipe/types';

export function ItemTagGroups({
  groups,
  dataset,
  lang,
  names,
  query,
  nav,
}: {
  groups: [string, string[]][];
  dataset: DatasetRef;
  lang: Lang;
  names: Record<string, Record<string, string>>;
  query: string;
  nav: RecipeHrefOpts;
}) {
  const t = useTranslations();
  const resolved = useResolvedLang();
  if (!groups.length) {
    return <EmptyState variant="empty">{t('No tags for this item.', { note: 'recipe.empty_tags' })}</EmptyState>;
  }
  return (
    <div className="flex flex-col gap-3 pt-1">
      {groups.map(([tagKind, ids]) => (
        <div key={tagKind} className="flex flex-col gap-1.5">
          {groups.length > 1 && (
            <p className="text-xs font-medium text-muted-foreground">
              {tagKind === 'block'
                ? t('Blocks', { note: 'recipe.tags_block' })
                : t('Items', { note: 'recipe.tags_item' })}
            </p>
          )}
          <div className="flex flex-wrap gap-1">
            {ids.map((id) => {
              const bare = id.replace(/^#+/, '');
              return (
                <LinkPreview
                  key={`${tagKind}:${id}`}
                  href={recipeHref(dataset, resolved, {
                    type: 'emi:tag',
                    id: tagPseudoId(id, tagKind),
                    search: query || undefined,
                    tab: nav.tab,
                    version: nav.version,
                  })}
                  variant="chip"
                  size="sm"
                  onClick={(event) => {
                    if (!event.shiftKey) return;
                    event.preventDefault();
                    const token = `#${bare}`;
                    const text = query.trim();
                    const search =
                      !text || text.split(/\s+/).includes(token)
                        ? text || token
                        : `${text} ${token}`;
                    replaceUrlState(
                      recipeHref(dataset, resolved, {
                        type: 'emi:tag',
                        search,
                        version: nav.version,
                      }),
                    );
                  }}
                >
                  {recipeItemName(names, lang, id)}
                </LinkPreview>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

