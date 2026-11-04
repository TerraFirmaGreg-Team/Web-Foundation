import { Globe } from 'lucide-react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import countries from 'flag-icons/country.json';

const CODES = new Set(countries.map((country) => country.code));

export function LangFlag({
  locale,
  className,
}: {
  locale: string;
  className?: string;
}) {
  const region = locale.split(/[-_]/)[1]?.toLowerCase();
  if (!region || !CODES.has(region)) {
    return <Globe className={cn('size-4', className)} />;
  }
  return (
    <span
      aria-hidden
      className={cn('fi fis rounded-full text-base', `fi-${region}`, className)}
    />
  );
}

