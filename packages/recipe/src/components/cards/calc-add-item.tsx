'use client';
import type { RecipeCompactRow, RecipeSession } from '@terrafirmagreg-team/recipe/types';

import { Workflow } from 'lucide-react';
import { ContextMenuItem } from '@terrafirmagreg-team/ui/components/ui/context-menu';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { encodeCalcState } from '@terrafirmagreg-team/recipe/lib/calc/tree';
import { recipeCalcHref } from '@terrafirmagreg-team/recipe/lib/links';
import { stackIdBase } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { pushUrlState } from '@terrafirmagreg-team/ui/lib/utils/history';

export function CalcAddMenuItem({
  session,
  row,
}: {
  session: RecipeSession;
  row: RecipeCompactRow;
}) {
  const t = useTranslations();
  const resolved = useResolvedLang();
  const out = row.out[0];
  if (!out) return null;
  const materialId = stackIdBase(out);
  const kind = session.index?.fluids?.includes(materialId) ? 'fluid' : 'item';
  return (
    <ContextMenuItem
      onClick={() =>
        pushUrlState(
          recipeCalcHref(
            session.dataset,
            resolved,
            encodeCalcState({
              cards: [
                {
                  id: `c${crypto.randomUUID()}`,
                  materialId,
                  kind,
                  recipeId: row.id,
                  crafts: 1,
                },
              ],
              pipes: [],
              tagSelections: {},
              notes: [],
            }),
            session.nav.version,
          ),
        )
      }
    >
      <Workflow />
      {t('Add to new scheme', { note: 'recipe.calc.new_scheme' })}
    </ContextMenuItem>
  );
}
