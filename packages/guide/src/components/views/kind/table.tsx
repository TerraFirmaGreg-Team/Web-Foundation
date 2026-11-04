import { GuideText } from '@terrafirmagreg-team/guide/components/views/text';
import { Card } from '@terrafirmagreg-team/ui/components/ui/card';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@terrafirmagreg-team/ui/components/ui/table';
import { collectItemIds } from '@terrafirmagreg-team/guide/lib/data/parse';
import { cssColor, cellTexts } from '@terrafirmagreg-team/guide/lib/table';
import { guideFormatOpts } from '@terrafirmagreg-team/guide/lib/format';
import type { GuideTableCell, PageRendererProps } from '@terrafirmagreg-team/guide/types';

export function TablePage(props: PageRendererProps) {
  const { page } = props;
  const raw = page.strings ?? page.rows ?? [];
  const cells = Array.isArray(raw) ? raw : [];
  const columnCount =
    typeof page.columns === 'number' ? page.columns : undefined;
  const rows =
    columnCount && columnCount > 0
      ? Array.from(
          { length: Math.ceil(cells.length / (columnCount + 1)) },
          (_, index) =>
            cells.slice(
              index * (columnCount + 1),
              (index + 1) * (columnCount + 1),
            ),
        )
      : cells.map((cell) => (Array.isArray(cell) ? cell : [cell]));
  const opts = guideFormatOpts(props);
  if (!rows.length) {
    return <Card className="min-h-16 bg-secondary p-0" aria-hidden />;
  }
  const legend = Array.isArray(page.legend) ? page.legend : [];
  const legendItems = legend
    .map((entry) => ({
      color: cssColor(entry.color),
      lines: (Array.isArray(entry.texts)
        ? entry.texts.filter(Boolean)
        : entry.text
          ? [entry.text]
          : []
      ) as string[],
    }))
    .filter((entry) => entry.lines.length);

  return (
    <>
      <Table className="border-collapse text-left">
        {Array.isArray(page.columns) && page.columns.length ? (
          <TableHeader>
            <TableRow className="border-0 hover:bg-transparent">
              {page.columns.map((column) => (
                <TableHead
                  key={column}
                  className="h-auto border border-border bg-secondary px-2 py-1 whitespace-normal"
                >
                  <GuideText text={column} {...opts} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        ) : null}
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex} className="border-0 hover:bg-transparent">
              {row.map((cell, columnIndex) => {
                const value: GuideTableCell | undefined =
                  cell && typeof cell === 'object' && !Array.isArray(cell)
                    ? (cell as GuideTableCell)
                    : undefined;
                const items = value ? collectItemIds(value.item) : [];
                const lines = value
                  ? cellTexts(value)
                  : typeof cell === 'string'
                    ? [cell]
                    : [];
                return (
                  <TableCell
                    key={columnIndex}
                    className={
                      value?.bold
                        ? 'border border-border px-2 py-1 font-semibold whitespace-normal'
                        : 'border border-border px-2 py-1 whitespace-normal'
                    }
                    style={{ backgroundColor: cssColor(value?.fill) }}
                  >
                    <span className="inline-flex flex-wrap items-center gap-1">
                      {items.map((id) => (
                        <Entry
                          kind="item"
                          key={id}
                          id={id}
                          name={id}
                          size="sm"
                          href={false}
                        />
                      ))}
                      {lines.map((line, index) => (
                        <span key={index}>
                          <GuideText text={line} {...opts} />
                        </span>
                      ))}
                    </span>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {legendItems.length ? (
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {legendItems.map((entry, index) => (
            <li key={index} className="flex items-center gap-2">
              {entry.color ? (
                <span
                  className="inline-block size-3 rounded-sm"
                  style={{ backgroundColor: entry.color }}
                />
              ) : null}
              <span className="flex flex-wrap gap-x-2">
                {entry.lines.map((line, lineIndex) => (
                  <span key={lineIndex}>
                    <GuideText text={line} {...opts} />
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

