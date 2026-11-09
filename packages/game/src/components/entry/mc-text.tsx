import { FormatText } from '@terrafirmagreg-team/ui/components/blocks/text/format-text';
import type { ColorSurface } from '@terrafirmagreg-team/ui/lib/color';
import { MC_FORMAT } from '@terrafirmagreg-team/dump/lib/dump/contract/text';

export function McText({
  text,
  surface = 'normal',
}: {
  text: string;
  surface?: ColorSurface;
}) {
  return <FormatText text={text} format={MC_FORMAT} surface={surface} />;
}
