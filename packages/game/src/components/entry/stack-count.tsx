import { SpriteCount } from '@terrafirmagreg-team/ui/components/blocks/sprite';

export function StackCount({
  count,
  limit,
}: {
  count: number;
  limit?: number;
}) {
  return (
    <SpriteCount
      count={count}
      limit={limit}
      className="font-mc pointer-events-none leading-none text-white"
      style={{ fontSize: 9, textShadow: '1px 1px 0 var(--color-mc-arrow)' }}
    />
  );
}
