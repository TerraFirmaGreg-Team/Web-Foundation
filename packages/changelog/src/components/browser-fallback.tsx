import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';

export function ChangelogBrowserFallback() {
  return (
    <div className="flex flex-col gap-8 pt-6">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="h-6 w-32" />
          <div className="flex flex-col gap-2.5 border-l border-border ps-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
