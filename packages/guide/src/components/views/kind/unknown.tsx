import { Alert, AlertTitle } from '@terrafirmagreg-team/ui/components/ui/alert';
import type { GuidePage } from '@terrafirmagreg-team/guide/lib/data/dto';
import type { PageRendererProps } from '@terrafirmagreg-team/guide/types';

export function UnknownPage({
  page,
  index,
}: { page: GuidePage; index?: number } & PageRendererProps) {
  const keys = Object.keys(page).filter((key) => key !== 'type');
  return (
    <Alert variant="destructive">
      <AlertTitle>
        Unknown page type &quot;{page.type ?? 'text'}&quot;
        {index !== undefined ? ` on page ${index + 1}` : ''}
      </AlertTitle>
      {keys.length ? (
        <pre className="mt-2 overflow-auto text-xs">
          {JSON.stringify(page, null, 2)}
        </pre>
      ) : null}
    </Alert>
  );
}

