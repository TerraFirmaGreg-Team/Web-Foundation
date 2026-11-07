'use client';

import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';

import { uiConfig } from '@terrafirmagreg-team/ui/lib/config';
import { SiteTitle } from '@terrafirmagreg-team/ui/components/blocks/nav/site-title';
import { useAsyncValue } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { clientDumpLoader } from '@terrafirmagreg-team/kit/lib/config';
import {
  isDumpSection,
  parseSectionLocation,
} from '@terrafirmagreg-team/sites/location';
import { setVersionPreference } from '@terrafirmagreg-team/kit/hooks/use-version-pref';
import { useVersionedDataset } from '@terrafirmagreg-team/kit/hooks/use-versioned-dataset';
import { useSectionNames } from '@terrafirmagreg-team/kit/hooks/use-section-names';
import { VersionMenu } from '@terrafirmagreg-team/kit/components/version-menu';

export function NavTitle({ className, ...props }: ComponentProps<'a'>) {
  const { section, dataset } = parseSectionLocation(usePathname());
  const sectionNames = useSectionNames();
  const datasetId = dataset;

  const gameData = isDumpSection(section) && datasetId;
  const versions = useAsyncValue(
    gameData ? () => clientDumpLoader().loadVersions(datasetId) : false,
    [datasetId],
  );
  const ref = useVersionedDataset(
    gameData ? datasetId : undefined,
    versions ?? undefined,
  );
  const version = useAsyncValue(
    ref
      ? () =>
          clientDumpLoader()
            .loadDump(ref)
            .then((dump) => dump?.manifest.pack?.version ?? undefined)
      : false,
    [ref],
  );
  return (
    <SiteTitle
      href="/"
      icon={uiConfig().brand?.icon ?? ''}
      name={uiConfig().brand?.name ?? ''}
      subtitle={
        dataset && datasetId && gameData ? (
          <VersionMenu
            section={section}
            datasetId={datasetId}
            currentRef={ref ?? { id: datasetId }}
            label={version}
            versions={versions}
            onSelect={(next) => setVersionPreference(datasetId, next)}
          />
        ) : section ? (
          sectionNames[section]?.title
        ) : undefined
      }
      className={className}
      {...props}
    />
  );
}

