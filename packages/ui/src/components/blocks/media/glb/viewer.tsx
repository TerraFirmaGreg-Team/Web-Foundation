import dynamic from 'next/dynamic';
import { Box } from 'lucide-react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

export const GlbViewer = dynamic(
  () =>
    import('@terrafirmagreg-team/ui/components/blocks/media/glb/scene').then(
      (mod) => mod.GlbSession,
    ),
  { loading: () => <GlbPlaceholder /> },
);

export const GlbEmbedViewer = dynamic(
  () =>
    import('@terrafirmagreg-team/ui/components/blocks/media/glb/scene').then(
      (mod) => mod.GlbSession,
    ),
  { loading: () => <GlbPlaceholder bare /> },
);

export function GlbPlaceholder({
  title,
  bare,
}: {
  title?: string;
  bare?: boolean;
}) {
  return (
    <div
      className={cn(
        'not-prose overflow-hidden',
        bare
          ? 'h-full w-full'
          : 'viewer-surface my-3 rounded-xl border border-border',
      )}
      aria-label={title}
    >
      <div
        className={cn(
          'flex items-center justify-center',
          bare ? 'h-full w-full' : 'viewer-scene h-72 w-full',
        )}
        aria-hidden
      >
        {bare ? null : (
          <Box className="size-10 text-muted-foreground/40" />
        )}
      </div>
    </div>
  );
}

