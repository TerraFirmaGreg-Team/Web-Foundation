'use client';
import { type ReactNode, createElement, useMemo } from 'react';
import { DynamicIcon, type IconName } from 'lucide-react/dynamic';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { sectionTabs } from '@terrafirmagreg-team/sites/sections';
import {
  isDumpSection,
  resolveDatasetRef,
  sectionUrl,
} from '@terrafirmagreg-team/sites/location';
import { useCurrentDataset } from '@terrafirmagreg-team/kit/hooks/use-current-dataset';
import { useSectionNames } from '@terrafirmagreg-team/kit/hooks/use-section-names';
import { useVersionPreference } from '@terrafirmagreg-team/kit/hooks/use-version-pref';
import type { LeftSidebarScope } from '@terrafirmagreg-team/kit/types';
import type {
  SwitcherOption,
  SwitcherProps,
} from '@terrafirmagreg-team/ui/types/nav';

function datasetIcon(dataset: { icon?: IconName }): ReactNode {
  if (!dataset.icon) return undefined;
  return createElement(DynamicIcon, {
    name: dataset.icon,
    className: 'size-4 shrink-0',
  });
}

export function useNavOptions({ section, catalog }: LeftSidebarScope): {
  section: SwitcherProps;
  dataset: SwitcherProps;
} {
  const t = useTranslations();
  const sectionNames = useSectionNames();
  const current = useCurrentDataset(catalog[section]);
  const baseId = current ? current.id : undefined;
  const pinned = current ? current.version : undefined;
  const preferred = useVersionPreference(baseId);
  const version = pinned ?? preferred;

  const sectionOptions: SwitcherOption[] = useMemo(
    () =>
      sectionTabs.map(({ key, icon: Icon }) => {
        const meta = baseId
          ? catalog[key].find(({ id }) => id === baseId)
          : undefined;
        const pinned =
          isDumpSection(key) && baseId
            ? resolveDatasetRef(baseId, version, meta).pinned
            : undefined;
        const suffix = pinned ? `?version=${encodeURIComponent(pinned)}` : '';
        return {
          value: key,
          title: sectionNames[key]?.title ?? key,
          description: sectionNames[key]?.desc,
          icon: Icon ? createElement(Icon) : undefined,
          url: meta ? `${sectionUrl(key, baseId)}${suffix}` : sectionUrl(key),
        };
      }),
    [sectionNames, baseId, version, catalog],
  );

  const datasetOptions: SwitcherOption[] = useMemo(
    () =>
      catalog[section].map((datasetItem) => ({
        value: datasetItem.id,
        title: datasetItem.title ?? datasetItem.id,
        description: datasetItem.description,
        icon: datasetIcon(datasetItem),
        url: sectionUrl(section, datasetItem.id),
      })),
    [section, catalog],
  );

  return {
    section: {
      options: sectionOptions,
      selected: section,
      placeholder: t('Select section', { note: 'ui.select_section' }),
    },
    dataset: {
      options: datasetOptions,
      selected: baseId,
      placeholder: t('Select dataset', { note: 'ui.select_dataset' }),
    },
  };
}

