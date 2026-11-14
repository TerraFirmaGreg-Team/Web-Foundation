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
      className="font-mc mc-count pointer-events-none leading-none"
      style={{ fontSize: 9 }}
    />
  );
}
