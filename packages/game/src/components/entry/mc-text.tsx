import { FormatText } from '@terrafirmagreg-team/ui/components/blocks/text/format-text';
import { MC_FORMAT } from '@terrafirmagreg-team/dump/lib/dump/contract/text';

export function McText({ text }: { text: string }) {
  return <FormatText text={text} format={MC_FORMAT} />;
}
