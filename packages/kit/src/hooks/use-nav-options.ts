'use client';
import { type ReactNode, createElement, useMemo } from 'react';
import type { IconName } from 'lucide-react/dynamic';
import { lucideIcon } from '@terrafirmagreg-team/ui/lib/utils/icons';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { sectionTabs } from '@terrafirmagreg-team/sites/sections';
import {
  isDumpSection,
  resolveDatasetRef,
  sectionUrl,
} from '@terrafirmagreg-team/sites/location';
import { useCurrentDataset } from '@terrafirmagreg-team/kit/hooks/use-current-dataset';
import { sectionConfig } from '@terrafirmagreg-team/kit/lib/config';
import { useSectionNames } from '@terrafirmagreg-team/kit/hooks/use-section-names';
import { useVersionPreference } from '@terrafirmagreg-team/kit/hooks/use-version-pref';
import type { LeftSidebarScope } from '@terrafirmagreg-team/kit/types';
import type {
  SwitcherOption,
  SwitcherProps,
} from '@terrafirmagreg-team/ui/types/nav';

const EMPTY_DATASETS: never[] = [];

function datasetIcon(dataset: { icon?: IconName }): ReactNode {
  const Icon = dataset.icon ? lucideIcon(dataset.icon) : undefined;
  if (!Icon) return undefined;
  return createElement(Icon, { className: 'size-4 shrink-0' });
}

export function useNavOptions({ section, catalog }: LeftSidebarScope): {
  section: SwitcherProps;
  dataset: SwitcherProps;
} {
  const t = useTranslations();
  const sectionNames = useSectionNames();
  const sectionDatasets = catalog[section] ?? EMPTY_DATASETS;
  const current = useCurrentDataset(sectionDatasets);
  const baseId = current ? current.id : undefined;
  const pinned = current ? current.version : undefined;
  const preferred = useVersionPreference(baseId);
  const version = pinned ?? preferred;

  const sectionOptions: SwitcherOption[] = useMemo(
    () =>
      sectionTabs.map(({ key, icon: Icon }) => {
        const meta = baseId
          ? catalog[key]?.find(({ id }) => id === baseId)
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
          icon: Icon
            ? createElement(Icon, {
                color: sectionConfig().sectionAccent?.[key],
              })
            : undefined,
          url: meta ? `${sectionUrl(key, baseId)}${suffix}` : sectionUrl(key),
        };
      }),
    [sectionNames, baseId, version, catalog],
  );

  const datasetOptions: SwitcherOption[] = useMemo(
    () =>
      sectionDatasets.map((datasetItem) => ({
        value: datasetItem.id,
        title: datasetItem.title ?? datasetItem.id,
        description: datasetItem.description,
        icon: datasetIcon(datasetItem),
        url: sectionUrl(section, datasetItem.id),
      })),
    [section, sectionDatasets],
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

