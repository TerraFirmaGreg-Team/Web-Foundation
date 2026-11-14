import { icons, type LucideIcon } from 'lucide-react';

export function lucideIcon(name: string): LucideIcon | undefined {
  const key = name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return (icons as Record<string, LucideIcon>)[key];
}
