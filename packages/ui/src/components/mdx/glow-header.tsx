import type { ComponentProps } from 'react';
import { gradientImage, type GradientProps } from '@terrafirmagreg-team/ui/lib/mdx/gradient';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

export function GlowHeader({
  fade,
  gradient,
  from,
  to,
  dir,
  image,
  style,
  className,
  children,
  ...props
}: GradientProps & { fade?: boolean; gradient?: boolean } & ComponentProps<'span'>) {
  const boxFrom = from ?? '#fa18cf';
  const boxTo = to ?? '#ff7967';
  const gradientBg = gradientImage({ from, to, dir, image });
  const boxBg = `radial-gradient(color-mix(in srgb, ${boxFrom} 18%, transparent), color-mix(in srgb, ${boxTo} 8%, transparent))`;
  return (
    <span
      className={cn(
        'relative mb-6 inline-block rounded-[20px] px-4 py-2.5 text-center',
        className,
      )}
      style={{
        backgroundImage: gradient ? `${gradientBg}, ${boxBg}` : boxBg,
        ...(gradient && {
          WebkitBackgroundClip: 'text, border-box',
          backgroundClip: 'text, border-box',
          WebkitTextFillColor: 'transparent',
        }),
        boxShadow: `0 10px 20px color-mix(in srgb, ${boxFrom} 25%, transparent)`,
        ...style,
      }}
      {...props}
    >
      {children}
      {fade && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full"
          style={{
            backgroundImage: gradientBg,
            maskImage:
              'linear-gradient(to right, transparent, black 25%, black 75%, transparent)',
          }}
        />
      )}
    </span>
  );
}

