import type { ComponentProps } from 'react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

export function Video({
  src,
  title,
  className,
  ...props
}: ComponentProps<'div'> & { src: string; title?: string }) {
  return (
    <div
      className={cn(
        'not-prose my-6 mx-auto w-full max-w-2xl overflow-hidden rounded-xl border bg-card',
        className,
      )}
      {...props}
    >
      <iframe
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="aspect-video w-full"
      />
    </div>
  );
}
