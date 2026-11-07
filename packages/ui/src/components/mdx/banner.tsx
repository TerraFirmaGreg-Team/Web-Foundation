'use client';

import { type CSSProperties, type HTMLAttributes, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { buttonVariants } from '@terrafirmagreg-team/ui/components/ui/button';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import {
  gradientImage,
  type GradientProps,
} from '@terrafirmagreg-team/ui/lib/mdx/gradient';

type BannerVariant = 'rainbow' | 'normal' | 'fade' | 'glow';

export type BannerProps = HTMLAttributes<HTMLDivElement> &
  GradientProps & {

    height?: string;

    variant?: BannerVariant;

    gradient?: boolean;

    rainbowColors?: string[];

    changeLayout?: boolean;
  };

const fadeMask = {
  WebkitMask:
    'linear-gradient(#fff 0 0) content-box, linear-gradient(to bottom, #fff 0%, transparent 100%) border-box',
  WebkitMaskComposite: 'destination-out',
  mask: 'linear-gradient(to bottom, #fff 0%, transparent 100%) border-box subtract, linear-gradient(#fff 0 0) content-box',
} as CSSProperties;

export function Banner({
  id,
  variant = 'normal',
  changeLayout = true,
  height,
  gradient,
  from,
  to,
  dir,
  image,
  rainbowColors = [
    'rgba(0,149,255,0.56)',
    'rgba(231,77,255,0.77)',
    'rgba(255,0,0,0.73)',
    'rgba(131,255,166,0.66)',
  ],
  style,
  ...props
}: BannerProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(true);
  const glow = variant === 'fade' || variant === 'glow';
  const globalKey = id ? `banner-${encodeBase32(id)}` : null;

  useEffect(() => {
    if (globalKey && localStorage.getItem(globalKey) === 'true') setOpen(false);
  }, [globalKey]);

  function onClose() {
    setOpen(false);
    if (globalKey) localStorage.setItem(globalKey, 'true');
  }

  if (!open) return null;

  const gradientBg = gradientImage({ from, to, dir, image });
  const textStyle: CSSProperties | undefined = gradient
    ? {
        backgroundImage: gradientBg,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
      }
    : undefined;

  return (
    <div
      id={id}
      {...props}
      className={cn(
        'flex flex-row items-center justify-center px-4 text-center font-medium',
        glow
          ? 'relative isolate mt-10 mb-6 overflow-hidden rounded-[20px] p-2.5 text-xl font-semibold [&_:is(h1,h2,h3,h4,h5,h6)]:m-0 [&_:is(h1,h2,h3,h4,h5,h6)]:border-0 [&_:is(h1,h2,h3,h4,h5,h6)]:p-0 [&_:is(h1,h2,h3,h4,h5,h6)_button]:hidden'
          : 'sticky top-0 z-40 rounded-xl text-sm',
        variant === 'normal' && 'bg-secondary',
        variant === 'rainbow' && 'bg-background',
        !open && 'hidden',
        props.className,
      )}
      style={{
        height: height ?? (glow ? undefined : '3rem'),
        ...(variant === 'glow'
          ? {
              backgroundImage:
                'radial-gradient(var(--header-bg-inner), var(--header-bg-outer))',
              boxShadow: '0 0 20px var(--header-shadow)',
            }
          : {}),
        ...style,
      }}
    >
      {changeLayout && open ? (
        <style>
          {globalKey
            ? `:root:not(.${globalKey}) { --banner-height: ${height}; }`
            : `:root { --banner-height: ${height}; }`}
        </style>
      ) : null}
      {globalKey ? <style>{`.${globalKey} #${id} { display: none; }`}</style> : null}
      {globalKey ? (
        <script
          dangerouslySetInnerHTML={{
            __html: `if (localStorage.getItem('${globalKey}') === 'true') document.documentElement.classList.add('${globalKey}');`,
          }}
        />
      ) : null}

      {variant === 'rainbow'
        ? flow({
            colors: rainbowColors,
          })
        : null}
      {variant === 'fade' ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] p-px"
          style={{ backgroundImage: gradientBg, ...fadeMask }}
        />
      ) : null}
      <div className="relative" style={textStyle}>
        {props.children}
      </div>
      {id ? (
        <button
          type="button"
          aria-label={t('Close Banner', { note: 'ui.banner_close' })}
          onClick={onClose}
          className={cn(
            buttonVariants({
              variant: 'ghost',
              className: 'absolute inset-e-2 top-1/2 -translate-y-1/2 text-muted-foreground/50',
              size: 'icon-sm',
            }),
          )}
        >
          <X />
        </button>
      ) : null}
    </div>
  );
}

const maskImage =
  'linear-gradient(to bottom,white,transparent), radial-gradient(circle at top center, white, transparent)';

function flow({ colors }: { colors: string[] }) {
  return (
    <>
      <div
        className="absolute inset-0 -z-1"
        style={{
          maskImage,
          maskComposite: 'intersect',
          animation: 'moving-banner 20s linear infinite',
          backgroundImage: `repeating-linear-gradient(70deg, ${[...colors, colors[0]].map((color, i) => `${color} ${(i * 50) / colors.length}%`).join(', ')})`,
          backgroundSize: '200% 100%',
          filter: 'saturate(2)',
        }}
      />
      <style>
        {`@keyframes moving-banner {
            from { background-position: 0% 0;  }
            to { background-position: 100% 0;  }
         }`}
      </style>
    </>
  );
}

function encodeBase32(str: string) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
  let encoded = '';

  let buffer = 0;
  let bitsLeft = 0;

  for (let i = 0; i < str.length; i++) {
    buffer = (buffer << 8) | str.charCodeAt(i);
    bitsLeft += 8;

    while (bitsLeft >= 5) {
      bitsLeft -= 5;
      encoded += alphabet[(buffer >> bitsLeft) & 31];
    }
  }

  if (bitsLeft > 0) {
    encoded += alphabet[(buffer << (5 - bitsLeft)) & 31];
  }

  return encoded;
}

