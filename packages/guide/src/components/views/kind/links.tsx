import { LinkPreview } from '@terrafirmagreg-team/ui/components/blocks/link/link-preview';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { guideEmbeds } from '@terrafirmagreg-team/guide/lib/embeds';
import { guideMessage } from '@terrafirmagreg-team/guide/lib/messages';
import {
  entryLabel,
  entryRef,
  spriteName,
} from '@terrafirmagreg-team/guide/lib/names';
import { referenceHref } from '@terrafirmagreg-team/guide/lib/reference';
import { parseGuideReference } from '@terrafirmagreg-team/guide/lib/reference/resolver';
import type { PageRendererProps } from '@terrafirmagreg-team/guide/types';

export function RelationPage(props: PageRendererProps) {
  const ids = (props.page.entries ?? []).filter(
    (value): value is string => typeof value === 'string' && Boolean(value),
  );
  if (!ids.length) return null;
  return (
    <ul className="space-y-1">
      {ids.map((id, index) => {
        const resolved = referenceHref(props, id);
        const ref = entryRef(props.entryRefs, id);
        const name = entryLabel(props.entryRefs, props.langMap, id);
        return (
          <li key={`${id}:${index}`} className="flex items-center gap-2">
            {ref?.icon ? (
              <Entry
                id={ref.icon.id}
                kind={ref.icon.kind}
                dataset={props.dataset}
                size="sm"
                href={false}
                tooltip={false}
              />
            ) : null}
            {resolved ? (
              <LinkPreview
                variant="text"
                href={resolved.href}
                preview={props.previews?.[resolved.href]}
              >
                {name}
              </LinkPreview>
            ) : (
              <span className="text-muted-foreground">{name}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function LinkPage(props: PageRendererProps) {
  const target = props.page.url || props.page.link || props.page.entry || '';
  const resolved = target ? referenceHref(props, target) : null;
  const label =
    (typeof props.page.link_text === 'string' && props.page.link_text) ||
    (typeof props.page.text === 'string' && props.page.text) ||
    (typeof props.page.name === 'string' && props.page.name) ||
    target ||
    guideMessage(props.messages, 'guide.link');
  return (
    <p>
      {resolved ? (
        <LinkPreview
          variant="chip"
          solid
          href={resolved.href}
          preview={props.previews?.[resolved.href]}
        >
          {label}
        </LinkPreview>
      ) : (
        <span className="text-muted-foreground">{label}</span>
      )}
    </p>
  );
}

export function QuestPage({
  dataset,
  page,
  lang,
  langMap,
  atlases,
  questLinks,
  previews,
  messages,
}: PageRendererProps) {
  const id = page.trigger || page.quest || page.link;
  const hit = id ? questLinks?.[parseGuideReference(id).id] : undefined;
  const href = hit
    ? guideEmbeds().quest?.href(dataset, lang, { category: hit.filename, id: hit.questId })
    : undefined;
  const name = id ? spriteName(dataset, langMap, atlases, id) : '—';
  const label = id && name !== id ? name : <code>{name}</code>;
  return (
    <p className="text-sm text-muted-foreground">
      {guideMessage(messages, 'guide.quest')}:{' '}
      {href ? (
        <LinkPreview href={href} preview={previews?.[href]}>
          {label}
        </LinkPreview>
      ) : (
        label
      )}
    </p>
  );
}

