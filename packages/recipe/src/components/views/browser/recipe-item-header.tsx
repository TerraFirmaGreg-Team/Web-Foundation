'use client';

import { Check, Copy } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { ItemRow } from '@terrafirmagreg-team/ui/components/blocks/list/row';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { CopyIdMenu } from '@terrafirmagreg-team/game/components/entry/copy-id-menu';
import { ButtonCopy } from '@terrafirmagreg-team/recipe/components/button-copy';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import { parseStackId } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { formatNbt } from '@terrafirmagreg-team/dump/lib/snbt';
import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';

export function RecipeItemHeader({
  recipe,
  session,
}: {
  recipe: Recipe;
  session: RecipeSession;
}) {
  const t = useTranslations();
  const output = recipe.outputs[0];
  const stackId = output?.id ?? recipe.id;
  const parsed = parseStackId(stackId);
  const name = recipeItemName(session.names, session.lang, parsed.id);
  const nbt = formatNbt(parsed.nbt);
  return (
    <ItemRow
      layout="header"
      media={
        <CopyIdMenu id={parsed.id} nbt={nbt}>
          <Entry
            id={stackId}
            kind={output?.kind === 'fluid' ? 'fluid' : 'item'}
            name={name}
            size="lg"
            variant="chip"
            href={false}
          />
        </CopyIdMenu>
      }
      title={name}
      titleClassName="truncate"
      code={
        <span className="inline-flex max-w-full items-center gap-0.5">
          <span className="truncate">{recipe.id}</span>
          <ButtonCopy
            value={recipe.id}
            title={t('Copy recipe id', { note: 'recipe.copy_recipe_id' })}
            aria-label={t('Copy recipe id', { note: 'recipe.copy_recipe_id' })}
            copy={<Copy className="size-3" />}
            copied={<Check className="size-3" />}
          />
        </span>
      }
    />
  );
}

