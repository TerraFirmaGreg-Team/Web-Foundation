'use client';

import { Fragment, useEffect, type ReactNode } from 'react';
import { TriangleAlertIcon } from 'lucide-react';
import type { DatasetRef, DatasetSnapshot } from '@terrafirmagreg-team/sites/location';
import { useDatasetSnapshot } from '@terrafirmagreg-team/kit/hooks/use-dataset-snapshot';
import { datasetSnapshotKey } from '@terrafirmagreg-team/kit/lib/dataset-snapshots';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Button } from '@terrafirmagreg-team/ui/components/ui/button';
import { Spinner } from '@terrafirmagreg-team/ui/components/ui/spinner';

export function SnapshotBoundary({
  selection,
  fallback,
  children,
}: {
  selection: DatasetRef;
  fallback: ReactNode;
  children: (snapshot: DatasetSnapshot) => ReactNode;
}) {
  const { active, candidate, pending, confirming, error, retry, confirm } =
    useDatasetSnapshot(selection);
  const t = useTranslations();
  useEffect(() => {
    if (candidate && !confirming && !error) void confirm();
  }, [candidate, confirming, error, confirm]);
  const updating = confirming || Boolean(candidate);
  return (
    <>
      {!active && error ? (
        <div
          role="status"
          aria-live="polite"
          aria-busy={pending}
          className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/50 px-4 py-2 text-sm"
        >
          <span>{t('Could not load dataset.', { note: 'kit.snapshot_error' })}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => { void retry(); }}
          >
            {pending
              ? t('Loading data…', { note: 'kit.snapshot_loading' })
              : t('Retry', { note: 'kit.snapshot_retry' })}
          </Button>
        </div>
      ) : updating || error ? (
        <div
          role="status"
          aria-live="polite"
          aria-busy={confirming}
          className="fixed inset-x-4 bottom-4 z-overlay mx-auto flex w-fit items-center gap-2 rounded-full border border-border bg-popover px-3 py-1.5 text-xs text-muted-foreground shadow-lg sm:left-auto sm:right-4 sm:mx-0"
        >
          {error ? (
            <TriangleAlertIcon className="size-3.5" aria-hidden />
          ) : (
            <Spinner className="size-3.5" />
          )}
          <span>
            {error
              ? t('Could not load updated data. Your current data is still available.', {
                  note: 'kit.snapshot_update_error',
                })
              : t('Loading data…', { note: 'kit.snapshot_loading' })}
          </span>
        </div>
      ) : null}
      {active ? (
        <Fragment key={datasetSnapshotKey(active)}>{children(active)}</Fragment>
      ) : (
        <div aria-busy={pending} className="contents">
          {pending ? (
            <span role="status" aria-live="polite" className="sr-only">
              {t('Loading data…', { note: 'kit.snapshot_loading' })}
            </span>
          ) : null}
          {fallback}
        </div>
      )}
    </>
  );
}
