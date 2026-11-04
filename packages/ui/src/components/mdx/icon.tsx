import { icons, type LucideProps } from 'lucide-react';
import * as SI from '@icons-pack/react-simple-icons';
import type { ComponentType } from 'react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

const registry = icons as Record<string, ComponentType<LucideProps>>;
const brands = SI as unknown as Record<string, ComponentType<LucideProps>>;

function toPascal(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function Icon({
  name,
  className,
  ...props
}: { name: string } & LucideProps) {
  const Component =
    registry[name] ?? registry[toPascal(name)] ?? brands[`Si${toPascal(name)}`];
  if (!Component) return null;
  return (
    <Component
      className={cn(
        'inline-block align-[-0.125em]',
        props.size === undefined && 'size-[1em]',
        className,
      )}
      {...props}
    />
  );
}

