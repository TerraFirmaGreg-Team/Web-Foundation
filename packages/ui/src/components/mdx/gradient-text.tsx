import type { ComponentProps } from 'react';
import { gradientImage, type GradientProps } from '@terrafirmagreg-team/ui/lib/mdx/gradient';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

export function GradientText({
  from,
  to,
  dir,
  image,
  style,
  className,
  ...props
}: GradientProps & ComponentProps<'span'>) {
  return (
    <span
      className={cn('text-transparent', className)}
      style={{
        backgroundImage: gradientImage({ from, to, dir, image }),
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        ...style,
      }}
      {...props}
    />
  );
}

