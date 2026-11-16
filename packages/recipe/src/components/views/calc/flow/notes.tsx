'use client';

import { useRef, useState } from 'react';
import {
  ViewportPortal,
  useStore,
} from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import { Palette, X } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Hint } from '@terrafirmagreg-team/ui/components/blocks/tooltip/hint';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@terrafirmagreg-team/ui/components/ui/popover';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { CORNER_BUTTON } from '@terrafirmagreg-team/recipe/components/views/calc/node-card/actions';
import {
  CALC_NOTE_COLORS,
  type CalcNote,
  type CalcNoteColor,
} from '@terrafirmagreg-team/recipe/types/calc';
import type { CalcFlowData } from '@terrafirmagreg-team/recipe/lib/calc/flow';

const GRID = 16;

const NOTE_STYLES: Record<
  CalcNoteColor,
  { card: string; placeholder: string; swatch: string }
> = {
  amber: {
    card: 'border-amber-400/70 bg-amber-100/95 text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/90 dark:text-amber-50',
    placeholder:
      'placeholder:text-amber-900/50 dark:placeholder:text-amber-100/40',
    swatch: 'bg-amber-400',
  },
  slate: {
    card: 'border-slate-400/70 bg-slate-100/95 text-slate-950 dark:border-slate-500/40 dark:bg-slate-800/90 dark:text-slate-50',
    placeholder:
      'placeholder:text-slate-900/50 dark:placeholder:text-slate-100/40',
    swatch: 'bg-slate-400',
  },
  sky: {
    card: 'border-sky-400/70 bg-sky-100/95 text-sky-950 dark:border-sky-500/40 dark:bg-sky-950/90 dark:text-sky-50',
    placeholder: 'placeholder:text-sky-900/50 dark:placeholder:text-sky-100/40',
    swatch: 'bg-sky-400',
  },
  emerald: {
    card: 'border-emerald-400/70 bg-emerald-100/95 text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-950/90 dark:text-emerald-50',
    placeholder:
      'placeholder:text-emerald-900/50 dark:placeholder:text-emerald-100/40',
    swatch: 'bg-emerald-400',
  },
  rose: {
    card: 'border-rose-400/70 bg-rose-100/95 text-rose-950 dark:border-rose-500/40 dark:bg-rose-950/90 dark:text-rose-50',
    placeholder:
      'placeholder:text-rose-900/50 dark:placeholder:text-rose-100/40',
    swatch: 'bg-rose-400',
  },
  violet: {
    card: 'border-violet-400/70 bg-violet-100/95 text-violet-950 dark:border-violet-500/40 dark:bg-violet-950/90 dark:text-violet-50',
    placeholder:
      'placeholder:text-violet-900/50 dark:placeholder:text-violet-100/40',
    swatch: 'bg-violet-400',
  },
};

type NoteActions = Pick<
  CalcFlowData,
  'onMoveCard' | 'onRemoveCard' | 'onEditNote' | 'onNoteColor'
>;

function CalcNoteCard({
  note,
  snap,
  data,
}: {
  note: CalcNote;
  snap: boolean;
  data: NoteActions;
}) {
  const t = useTranslations();
  const transform = useStore((s) => s.transform);
  const zoom = transform[2];
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [seenTransform, setSeenTransform] = useState(transform);
  if (seenTransform !== transform) {
    setSeenTransform(transform);
    setPaletteOpen(false);
  }
  const grab = useRef<{
    pointerId: number;
    sx: number;
    sy: number;
    px: number;
    py: number;
  } | null>(null);

  const snapTo = (pos: { x: number; y: number }) =>
    snap
      ? { x: Math.round(pos.x / GRID) * GRID, y: Math.round(pos.y / GRID) * GRID }
      : pos;

  const pos = drag ?? note.pos;
  const styles = NOTE_STYLES[note.color ?? 'amber'];

  return (
    <div
      className="nodrag nopan nowheel pointer-events-auto absolute z-10"
      style={{ left: pos.x, top: pos.y }}
    >
      <div
        className={cn(
          'relative flex min-w-[180px] flex-col rounded-md border shadow-md',
          styles.card,
        )}
      >
        <span className="pointer-events-auto absolute -top-2.5 right-3 z-30 flex gap-0.5">
          <Popover open={paletteOpen} onOpenChange={setPaletteOpen}>
            <Hint
              label={t('Note color', { note: 'recipe.calc.note_color' })}
              side="top"
            >
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    aria-label={t('Note color', {
                      note: 'recipe.calc.note_color',
                    })}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={CORNER_BUTTON}
                  />
                }
              >
                <Palette className="size-2.5" />
              </PopoverTrigger>
            </Hint>
            <PopoverContent
              side="top"
              align="end"
              className="nodrag flex w-auto gap-1 p-1.5"
            >
              {CALC_NOTE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  aria-pressed={(note.color ?? 'amber') === color}
                  className={cn(
                    'size-4 rounded-full border border-border/60 transition-transform hover:scale-110',
                    NOTE_STYLES[color].swatch,
                    (note.color ?? 'amber') === color &&
                      'ring-2 ring-foreground/60 ring-offset-1 ring-offset-background',
                  )}
                  onClick={() => {
                    data.onNoteColor(note.id, color);
                    setPaletteOpen(false);
                  }}
                />
              ))}
            </PopoverContent>
          </Popover>
          <Hint
            label={t('Remove note', { note: 'recipe.calc.note_remove' })}
            side="top"
          >
            <button
              type="button"
              aria-label={t('Remove note', {
                note: 'recipe.calc.note_remove',
              })}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                data.onRemoveCard(note.id);
              }}
              className={cn(CORNER_BUTTON, 'hover:text-destructive')}
            >
              <X className="size-3" />
            </button>
          </Hint>
        </span>
        <div
          role="button"
          tabIndex={0}
          aria-label={t('Move note', { note: 'recipe.calc.note_move' })}
          className="flex cursor-grab touch-none items-center gap-1 px-1.5 py-0.5 active:cursor-grabbing"
          onKeyDown={(e) => {
            const d = { x: 0, y: 0 };
            if (e.key === 'ArrowLeft') d.x = -GRID;
            else if (e.key === 'ArrowRight') d.x = GRID;
            else if (e.key === 'ArrowUp') d.y = -GRID;
            else if (e.key === 'ArrowDown') d.y = GRID;
            else return;
            e.preventDefault();
            data.onMoveCard(
              note.id,
              snapTo({ x: note.pos.x + d.x, y: note.pos.y + d.y }),
            );
          }}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            grab.current = {
              pointerId: e.pointerId,
              sx: e.clientX,
              sy: e.clientY,
              px: note.pos.x,
              py: note.pos.y,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const g = grab.current;
            if (!g || g.pointerId !== e.pointerId) return;
            setDrag(
              snapTo({
                x: g.px + (e.clientX - g.sx) / zoom,
                y: g.py + (e.clientY - g.sy) / zoom,
              }),
            );
          }}
          onPointerUp={(e) => {
            const g = grab.current;
            if (!g || g.pointerId !== e.pointerId) return;
            grab.current = null;
            const next = snapTo({
              x: g.px + (e.clientX - g.sx) / zoom,
              y: g.py + (e.clientY - g.sy) / zoom,
            });
            setDrag(null);
            if (next.x !== note.pos.x || next.y !== note.pos.y) {
              data.onMoveCard(note.id, next);
            }
          }}
          onPointerCancel={() => {
            grab.current = null;
            setDrag(null);
          }}
        >
          <span className="flex-1" />
        </div>
        <textarea
          key={note.text}
          defaultValue={note.text}
          rows={3}
          placeholder={t('Note…', { note: 'recipe.calc.note_placeholder' })}
          className={cn(
            'nodrag nopan nowheel min-h-9 min-w-[180px] resize bg-transparent px-2 pb-1.5 text-xs leading-4 outline-none',
            styles.placeholder,
          )}
          onPointerDown={(e) => e.stopPropagation()}
          onBlur={(e) => {
            const text = e.currentTarget.value;
            if (text !== note.text) data.onEditNote(note.id, text);
          }}
        />
      </div>
    </div>
  );
}

export function CalcNotes({
  notes,
  snap,
  data,
}: {
  notes: CalcNote[];
  snap: boolean;
  data: NoteActions;
}) {
  if (!notes.length) return null;
  return (
    <ViewportPortal>
      {notes.map((note) => (
        <CalcNoteCard key={note.id} note={note} snap={snap} data={data} />
      ))}
    </ViewportPortal>
  );
}
