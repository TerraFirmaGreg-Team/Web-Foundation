'use client';

import {
  useCallback,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useCopyButton } from '@terrafirmagreg-team/ui/hooks/use-copy-button';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { recipeCalcHref, recipeStackHref } from '@terrafirmagreg-team/recipe/lib/links';
import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import { loadClientRecipe } from '@terrafirmagreg-team/recipe/lib/client/recipe';
import { resolveClientTag } from '@terrafirmagreg-team/dump/lib/dump/client/tags';
import {
  resolveRecipeAmount,
  toCalcRecipe,
} from '@terrafirmagreg-team/recipe/lib/calc/tree';
import { CALC_NODE_W } from '@terrafirmagreg-team/recipe/lib/calc/flow';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type {
  CalcCard,
  CalcKind,
  CalcNode,
  CalcNote,
  CalculatorState,
  CalcPipe,
  TagResolution,
} from '@terrafirmagreg-team/recipe/types/calc';
import type { RecipeRelation } from '@terrafirmagreg-team/recipe/types';
import type { CalcFlowData } from '@terrafirmagreg-team/recipe/lib/calc/flow';

let cardSeq = 0;
const newCardId = () =>
  `c${Date.now().toString(36)}${(cardSeq += 1).toString(36)}`;

export const NOTE_ID_PREFIX = 'n_';
const newNoteId = () =>
  `${NOTE_ID_PREFIX}${Date.now().toString(36)}${(cardSeq += 1).toString(36)}`;

function selectTagMember(
  prev: Record<string, string>,
  tagId: string,
  memberId: string,
): Record<string, string> {
  const base = tagId.replace(/^#+/, '');
  const next = { ...prev, [base]: memberId };
  delete next[`#${base}`];
  return next;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
}

export function useCalcActions({
  dataset,
  lang,
  linkVersion,
  cards,
  pipes,
  tagSelections,
  notes,
  persist,
  recipeDefaults,
  setRecipeDefault,
  recipeBody,
  encodeShare,
  flushAmounts,
  setFocusNodeId,
  nodes,
  tagMembers,
  ensureMaterial,
}: {
  dataset: DatasetRef;
  lang: Lang;
  linkVersion?: string;
  cards: CalcCard[];
  pipes: CalcPipe[];
  tagSelections: Record<string, string>;
  notes: CalcNote[];
  persist: (next: CalculatorState) => void;
  recipeDefaults: Record<string, string>;
  setRecipeDefault: (materialId: string, recipeId: string | null) => void;
  recipeBody: (recipeId: string) => Recipe | undefined;
  encodeShare: () => string;
  flushAmounts: () => CalcCard[];
  setFocusNodeId: Dispatch<SetStateAction<string | null>>;
  nodes: CalcNode[];
  tagMembers?: (tagId: string) => TagResolution | undefined;
  ensureMaterial?: (materialId: string) => void;
}) {
  const {
    checked: shared,
    isLoading: sharing,
    error: shareError,
    onClick: onShare,
  } = useCopyButton(async () => {
    const tree = encodeShare();
    const { id: datasetId, version } = dataset;
    try {
      const res = (await fetch(
        `/api/share/recipe/${encodeURIComponent(datasetId)}${version ? `?version=${encodeURIComponent(version)}` : ''}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ tree }),
        },
      ).then((r) => (r.ok ? r.json() : null))) as {
        id?: string;
        dataset?: DatasetRef;
      } | null;
      if (res?.id) {
        await copyText(
          `${window.location.origin}${recipeCalcHref(res.dataset ?? dataset, undefined, `s${res.id}`, linkVersion)}`,
        );
        return;
      }
    } catch {
    }
    await copyText(
      `${window.location.origin}${recipeCalcHref(dataset, undefined, tree, linkVersion)}`,
    );
  });

  const write = useCallback(
    (
      next: Partial<
        Pick<CalculatorState, 'cards' | 'pipes' | 'tagSelections' | 'notes'>
      >,
    ) => {
      persist({
        cards: next.cards ?? flushAmounts(),
        pipes: next.pipes ?? pipes,
        tagSelections: next.tagSelections ?? tagSelections,
        notes: next.notes ?? notes,
      });
    },
    [flushAmounts, persist, pipes, tagSelections, notes],
  );

  const onSelectRecipe = useCallback(
    (cardId: string, recipeId: string | null) => {
      if (!cards.some((row) => row.id === cardId)) return;
      const nextCards = cards.map((row) =>
        row.id === cardId ? { ...row, recipeId } : row,
      );
      const nextPipes = recipeId
        ? pipes
        : pipes.filter((pipe) => pipe.to !== cardId);
      write({ cards: nextCards, pipes: nextPipes });
    },
    [cards, pipes, write],
  );

  const onSelectTagMember = useCallback(
    (tagId: string, memberId: string) => {
      write({ tagSelections: selectTagMember(tagSelections, tagId, memberId) });
    },
    [tagSelections, write],
  );

  const onAddCard = useCallback(
    (materialId: string, kind: CalcKind, pos?: { x: number; y: number }) => {
      const id = newCardId();
      persist({
        cards: [
          ...flushAmounts(),
          { id, materialId, kind, recipeId: null, crafts: 1, pos },
        ],
        pipes,
        tagSelections,
        notes,
      });
      setFocusNodeId(id);
      return id;
    },
    [flushAmounts, persist, pipes, tagSelections, notes, setFocusNodeId],
  );

  const onSupplyInput = useCallback(
    (cardId: string, inputIndex: number, recipeId: string | null, outputAmount?: number) => {
      const consumerNode = nodes.find((n) => n.id === cardId);
      const consumerCard = cards.find((row) => row.id === cardId);
      const input = consumerNode?.inputs[inputIndex];
      if (!consumerNode || !consumerCard || !input?.id) return null;
      const materialId = input.id;
      const kind = input.kind;
      const need = Math.max(1, input.amount - input.covered);
      const base = consumerCard.pos;
      const id = newCardId();
      const nextPipes = [
        ...pipes.filter(
          (pipe) => !(pipe.to === cardId && pipe.input === inputIndex),
        ),
        { from: id, to: cardId, input: inputIndex },
      ];
      void (async () => {
        const per = recipeId
          ? await resolveRecipeAmount(
              recipeId,
              materialId,
              kind,
              async (id) =>
                recipeBody(id) ??
                (await loadClientRecipe(dataset, id).catch(() => undefined)),
              outputAmount ?? 0,
            )
          : 0;
        const crafts = recipeId && per > 0
          ? Math.max(1, Math.ceil(need / per))
          : need;
        persist({
          cards: [
            ...flushAmounts(),
            {
              id,
              materialId,
              kind,
              recipeId,
              crafts,
              pos: base
                ? { x: base.x - 40, y: base.y + 140 + inputIndex * 24 }
                : undefined,
            },
          ],
          pipes: nextPipes,
          tagSelections,
          notes,
        });
      })();
      return id;
    },
    [nodes, cards, pipes, flushAmounts, persist, tagSelections, notes, recipeBody, dataset],
  );

  const onDemandOutput = useCallback(
    (cardId: string, outputIndex: number, recipeId: string) => {
      const srcNode = nodes.find((n) => n.id === cardId);
      const srcCard = cards.find((row) => row.id === cardId);
      const out = srcNode?.outputs[outputIndex];
      if (!srcNode || !srcCard || !out) return;
      const need =
        out.remaining > 0 ? out.remaining : Math.max(1, out.amount);
      const base = srcCard.pos;
      void (async () => {
        const body = await loadClientRecipe(dataset, recipeId).catch(
          () => undefined,
        );
        const calc = body ? toCalcRecipe(body) : undefined;
        const inputs = calc?.inputs ?? [];
        let inputIndex = inputs.findIndex(
          (slot) =>
            !slot.catalyst && slot.id === out.id && slot.kind === out.kind,
        );
        let pickedTag: string | undefined;
        if (inputIndex < 0) {
          for (let i = 0; i < inputs.length; i += 1) {
            const slot = inputs[i];
            if (!slot?.tagId || slot.catalyst) continue;
            const members =
              tagMembers?.(slot.tagId)?.members ??
              (
                await resolveClientTag(dataset, slot.tagId).catch(
                  () => undefined,
                )
              )?.members ??
              [];
            if (members.includes(out.id)) {
              inputIndex = i;
              pickedTag = slot.tagId;
              break;
            }
          }
        }
        const product = calc?.outputs[0];
        const materialId = product?.id ?? out.id;
        const kind = product?.kind ?? out.kind;
        const inputAmount =
          inputIndex >= 0 ? (inputs[inputIndex]?.amount ?? 1) : 1;
        const crafts = Math.max(1, Math.ceil(need / inputAmount));
        const id = newCardId();
        const card: CalcCard = {
          id,
          materialId,
          kind,
          recipeId,
          crafts,
          pos: base
            ? {
                x: base.x + CALC_NODE_W + 90,
                y: base.y + 40 + outputIndex * 24,
              }
            : undefined,
        };
        persist({
          cards: [...flushAmounts(), card],
          pipes:
            inputIndex >= 0
              ? [
                  ...pipes,
                  {
                    from: cardId,
                    to: id,
                    input: inputIndex,
                    out: outputIndex,
                  },
                ]
              : pipes,
          tagSelections: pickedTag
            ? selectTagMember(tagSelections, pickedTag, out.id)
            : tagSelections,
          notes,
        });
        ensureMaterial?.(materialId);
        setFocusNodeId(id);
      })();
    },
    [
      nodes,
      cards,
      pipes,
      flushAmounts,
      persist,
      tagSelections,
      notes,
      dataset,
      tagMembers,
      ensureMaterial,
      setFocusNodeId,
    ],
  );

  const onOpenItem = useCallback(
    (materialId: string, kind: CalcKind, relation?: RecipeRelation) => {
      window.open(
        recipeStackHref(dataset, lang, materialId, { kind, relation, version: linkVersion }),
        '_blank',
        'noopener',
      );
    },
    [dataset, lang, linkVersion],
  );

  const onRemoveCard = useCallback(
    (cardId: string) => {
      if (cardId.startsWith(NOTE_ID_PREFIX)) {
        write({ notes: notes.filter((note) => note.id !== cardId) });
        return;
      }
      write({
        cards: flushAmounts().filter((row) => row.id !== cardId),
        pipes: pipes.filter(
          (pipe) => pipe.from !== cardId && pipe.to !== cardId,
        ),
      });
    },
    [flushAmounts, write, pipes, notes],
  );

  const onMoveCard = useCallback(
    (cardId: string, pos: { x: number; y: number }) => {
      if (cardId.startsWith(NOTE_ID_PREFIX)) {
        write({
          notes: notes.map((note) =>
            note.id === cardId ? { ...note, pos } : note,
          ),
        });
        return;
      }
      write({
        cards: flushAmounts().map((row) =>
          row.id === cardId ? { ...row, pos } : row,
        ),
      });
    },
    [flushAmounts, write, notes],
  );

  const onMoveCards = useCallback(
    (positions: Map<string, { x: number; y: number }>) => {
      write({
        cards: flushAmounts().map((row) => {
          const pos = positions.get(row.id);
          return pos ? { ...row, pos } : row;
        }),
      });
    },
    [flushAmounts, write],
  );

  const tagPinFor = useCallback(
    (
      to: string,
      input: number,
      from: string,
      out?: number,
    ): string | undefined => {
      const slot = nodes.find((n) => n.id === to)?.inputs[input];
      const srcOut = nodes.find((n) => n.id === from)?.outputs[out ?? 0];
      if (!slot?.tagId || !srcOut?.id) return undefined;
      const member = slot.members?.includes(srcOut.id);
      return member ?? slot.id === srcOut.id ? slot.tagId : undefined;
    },
    [nodes],
  );

  const onConnect = useCallback(
    (from: string, to: string, input: number, out?: number) => {
      if (from === to) return;
      const pinTag = tagPinFor(to, input, from, out);
      const srcOut = nodes
        .find((n) => n.id === from)
        ?.outputs[out ?? 0];
      write({
        pipes: [
          ...pipes.filter(
            (pipe) => !(pipe.to === to && pipe.input === input),
          ),
          { from, to, input, out: out || undefined },
        ],
        tagSelections:
          pinTag && srcOut?.id
            ? selectTagMember(tagSelections, pinTag, srcOut.id)
            : tagSelections,
      });
    },
    [pipes, write, nodes, tagSelections, tagPinFor],
  );

  const onDisconnect = useCallback(
    (from: string, to: string, input: number, out?: number) => {
      write({
        pipes: pipes.filter(
          (pipe) =>
            !(
              pipe.from === from &&
              pipe.to === to &&
              pipe.input === input &&
              (pipe.out ?? 0) === (out ?? 0)
            ),
        ),
      });
    },
    [pipes, write],
  );

  const onReroute = useCallback(
    (
      from: string,
      to: string,
      input: number,
      next: { from: string; to: string; input: number; out?: number },
    ) => {
      if (next.from === next.to) return;
      const pinTag = tagPinFor(next.to, next.input, next.from, next.out);
      const srcOut = nodes
        .find((n) => n.id === next.from)
        ?.outputs[next.out ?? 0];
      write({
        pipes: [
          ...pipes.filter(
            (pipe) =>
              !(pipe.from === from && pipe.to === to && pipe.input === input) &&
              !(pipe.to === next.to && pipe.input === next.input),
          ),
          next,
        ],
        tagSelections:
          pinTag && srcOut?.id
            ? selectTagMember(tagSelections, pinTag, srcOut.id)
            : tagSelections,
      });
    },
    [pipes, write, nodes, tagSelections, tagPinFor],
  );

  const onPipeLimit = useCallback(
    (from: string, to: string, input: number, amount: number | null) => {
      write({
        pipes: pipes.map((pipe) =>
          pipe.from === from && pipe.to === to && pipe.input === input
            ? { ...pipe, amount: amount ?? undefined }
            : pipe,
        ),
      });
    },
    [pipes, write],
  );

  const onClear = useCallback(() => {
    persist({
      cards: [],
      pipes: [],
      tagSelections: {},
      notes: [],
    });
  }, [persist]);

  const onAddNote = useCallback(
    (pos: { x: number; y: number }) => {
      const id = newNoteId();
      write({ notes: [...notes, { id, text: '', pos }] });
      return id;
    },
    [write, notes],
  );

  const onEditNote = useCallback(
    (id: string, text: string) => {
      write({
        notes: notes.map((note) =>
          note.id === id ? { ...note, text } : note,
        ),
      });
    },
    [write, notes],
  );

  const onNoteColor = useCallback(
    (id: string, color: CalcNote['color']) => {
      write({
        notes: notes.map((note) =>
          note.id === id ? { ...note, color } : note,
        ),
      });
    },
    [write, notes],
  );

  const flowData = useMemo<
    Omit<
      CalcFlowData,
      | 'node'
      | 'mode'
      | 'direction'
      | 'onRequestPicker'
      | 'onRequestMemberPicker'
      | 'onRequestSupply'
      | 'onRequestDemand'
      | 'onCrafts'
      | 'getRecipesForItem'
      | 'ensureMaterial'
    >
  >(
    () => ({
      dataset,
      recipeBody,
      onSelectRecipe,
      onSelectTagMember,
      onSupplyInput,
      onDemandOutput,
      onAddCard,
      onOpenItem,
      onRemoveCard,
      onMoveCard,
      onConnect,
      onDisconnect,
      onReroute,
      onPipeLimit,
      onEditNote,
      onNoteColor,
      recipeDefaults,
      onSetRecipeDefault: setRecipeDefault,
      tagSelections,
    }),
    [
      dataset,
      recipeBody,
      onSelectRecipe,
      onSelectTagMember,
      tagSelections,
      onSupplyInput,
      onDemandOutput,
      onAddCard,
      onOpenItem,
      onRemoveCard,
      onMoveCard,
      onConnect,
      onDisconnect,
      onReroute,
      onPipeLimit,
      onEditNote,
      onNoteColor,
      recipeDefaults,
      setRecipeDefault,
    ],
  );

  return {
    shared,
    sharing,
    shareError,
    onShare,
    flowData,
    onAddCard,
    onRemoveCard,
    onMoveCards,
    onSupplyInput,
    onAddNote,
    onClear,
  };
}

