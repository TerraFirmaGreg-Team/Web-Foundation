'use client';

import { Settings2 } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useHideUnused } from '@terrafirmagreg-team/recipe/hooks/use-hide-unused';
import { useSidebarGroup } from '@terrafirmagreg-team/recipe/hooks/use-sidebar-group';
import { Button } from '@terrafirmagreg-team/ui/components/ui/button';
import { Label } from '@terrafirmagreg-team/ui/components/ui/label';
import { Switch } from '@terrafirmagreg-team/ui/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@terrafirmagreg-team/ui/components/ui/popover';

export function RecipeSettings() {
  const t = useTranslations();
  const { hideUnused, setHideUnused } = useHideUnused();
  const { sidebarGroup, setSidebarGroup } = useSidebarGroup();

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t('Settings', { note: 'recipe.settings' })}
            className="rounded-lg"
          />
        }
      >
        <Settings2 className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-56 flex-col gap-2">
        <Label className="gap-1.5 text-sm font-normal">
          <Switch size="sm" checked={hideUnused} onCheckedChange={setHideUnused} />
          {t('Hide unused', { note: 'recipe.hide_unused' })}
        </Label>
        <Label className="gap-1.5 text-sm font-normal">
          <Switch
            size="sm"
            checked={sidebarGroup === 'mod'}
            onCheckedChange={(value) => setSidebarGroup(value ? 'mod' : 'flat')}
          />
          {t('Group sidebar by mod', { note: 'recipe.sidebar_group_mod' })}
        </Label>
      </PopoverContent>
    </Popover>
  );
}

