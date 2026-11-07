import type { HTMLAttributes } from 'react';
import {
  gradientImage,
  type GradientProps,
} from '@terrafirmagreg-team/ui/lib/mdx/gradient';

export function Gradient({
  from,
  to,
  dir,
  image,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & GradientProps) {
  return (
    <div
      {...props}
      style={{
        backgroundImage: gradientImage({ from, to, dir, image }),
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
        ...style,
      }}
    />
  );
}
