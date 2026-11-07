import 'server-only';
import { ViewCount } from './view-count';

export function PageActionsRight() {
  return (
    <ViewCount className="ms-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums" />
  );
}
