'use client';

import { Braces, Calculator, Check, Copy } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useModifierKeys } from '@terrafirmagreg-team/ui/hooks/use-modifier-keys';
import { ItemRow } from '@terrafirmagreg-team/ui/components/blocks/list/row';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { CopyIdMenu } from '@terrafirmagreg-team/game/components/entry/copy-id-menu';
import { ButtonCopy } from '@terrafirmagreg-team/recipe/components/button-copy';
import { FavoriteButton } from '@terrafirmagreg-team/recipe/components/views/browser/favorite-button';
import { IconButton } from '@terrafirmagreg-team/ui/components/blocks/button/icon-button';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@terrafirmagreg-team/ui/components/ui/popover';
import { formatNbt, formatNbtPretty } from '@terrafirmagreg-team/dump/lib/snbt';
import type { ParsedStackId } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { ReferenceKind } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';

export function ItemViewHeader({
  item,
  kind,
  name,
  parsed,
  favorite,
  onToggleFavorite,
  onAddToCalc,
}: {
  item: string;
  kind: ReferenceKind;
  name: string;
  parsed: ParsedStackId;
  favorite: boolean;
  onToggleFavorite: () => void;
  onAddToCalc?: () => void;
}) {
  const t = useTranslations();
  const held = useModifierKeys();
  const nbt = formatNbt(parsed.nbt);
  const pretty =
    parsed.nbt !== undefined ? formatNbtPretty(parsed.nbt) : undefined;
  const copyId = held.shift && nbt ? `${parsed.id}${nbt}` : parsed.id;
  const copyTitle = held.shift ? t('Copy stack id', { note: 'recipe.copy_stack' }) : t('Copy id', { note: 'recipe.copy' });
  return (
    <>
      <ItemRow
        layout="header"
        media={
          <CopyIdMenu id={parsed.id} nbt={nbt}>
            <Entry
              id={item}
              kind={kind}
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
            <span className="truncate">{parsed.id}</span>
            <ButtonCopy
              value={copyId}
              title={copyTitle}
              aria-label={copyTitle}
              copy={<Copy className="size-3" />}
              copied={<Check className="size-3" />}
            />
          </span>
        }
        trailing={
          <span className="flex items-center gap-1">
            {nbt && pretty ? (
              <Popover>
                <PopoverTrigger
                  render={
                    <IconButton
                      variant="ghost"
                      tooltip={false}
                      label={t('NBT', { note: 'recipe.nbt' })}
                      className="size-8 rounded-lg text-muted-foreground hover:text-foreground [&_svg]:size-3.5"
                    >
                      <Braces />
                    </IconButton>
                  }
                />
                <PopoverContent
                  align="end"
                  className="w-96 max-w-[calc(100vw-2rem)]"
                >
                  <div className="flex items-center justify-between">
                    <PopoverTitle className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                      {t('NBT', { note: 'recipe.nbt' })}
                    </PopoverTitle>
                    <ButtonCopy
                      value={nbt}
                      title={t('Copy NBT', { note: 'recipe.copy_nbt' })}
                      aria-label={t('Copy NBT', { note: 'recipe.copy_nbt' })}
                      copy={<Copy className="size-3" />}
                      copied={<Check className="size-3" />}
                    />
                  </div>
                  <pre className="max-h-80 overflow-auto rounded-md bg-muted/50 p-2 text-2xs leading-snug break-all whitespace-pre-wrap">
                    {pretty}
                  </pre>
                </PopoverContent>
              </Popover>
            ) : null}
            {onAddToCalc ? (
              <IconButton
                variant="ghost"
                label={t('Add to calculator', { note: 'recipe.calc.add.title' })}
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground [&_svg]:size-3.5"
                onClick={onAddToCalc}
              >
                <Calculator />
              </IconButton>
            ) : null}
            <FavoriteButton active={favorite} onToggle={onToggleFavorite} />
          </span>
        }
      />
    </>
  );
}

