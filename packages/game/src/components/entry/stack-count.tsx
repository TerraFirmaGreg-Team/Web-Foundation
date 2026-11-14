import { SpriteCount } from '@terrafirmagreg-team/ui/components/blocks/sprite';

export function StackCount({
  count,
  limit,
  format,
}: {
  count: number;
  limit?: number;
  format?: (count: number) => string;
}) {
  return (
    <SpriteCount
      count={count}
      limit={limit}
      format={format}
      className="font-mc pointer-events-none leading-none text-white"
      style={{ fontSize: 9, textShadow: '1px 1px 0 var(--color-mc-arrow)' }}
    />
  );
}
