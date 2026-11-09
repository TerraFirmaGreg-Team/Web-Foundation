import 'server-only';
import { featureMode } from '@terrafirmagreg-team/data';
import { ViewCount } from './view-count';

export function PageActionsRight() {
  const off = featureMode('ANALYTICS') === 'off';
  return (
    <ViewCount
      disabled={off}
      className={`ms-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums${off ? ' opacity-50' : ''}`}
    />
  );
}
