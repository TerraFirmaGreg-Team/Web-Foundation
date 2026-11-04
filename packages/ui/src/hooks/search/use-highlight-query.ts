'use client';
import { useCallback } from 'react';
import { injectHighlightStyle } from '@terrafirmagreg-team/ui/lib/utils/highlight-style';

function buildRegexFromQuery(query: string): RegExp | null {
  const source = query
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '|');
  return source ? new RegExp(source, 'gi') : null;
}

export function useHighlightQuery(query: string) {
  return useCallback(
    (element: Element | null) => {
      const regex = buildRegexFromQuery(query);
      if (!element || !regex || typeof Highlight === 'undefined')
        return () => {};
      let highlight = CSS.highlights.get('search-hit');
      if (!highlight) {
        CSS.highlights.set('search-hit', (highlight = new Highlight()));
        injectHighlightStyle(
          'search-hit',
          'color:var(--color-primary);text-decoration-line:underline',
        );
      }
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        (node) => {
          if (!(node instanceof Element)) return NodeFilter.FILTER_ACCEPT;
          return node.hasAttribute('data-highlight-ignore')
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_SKIP;
        },
      );
      const ranges: StaticRange[] = [];
      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        for (const match of node.data.matchAll(regex)) {
          const range = new StaticRange({
            startContainer: node,
            startOffset: match.index,
            endContainer: node,
            endOffset: match.index + match[0].length,
          });
          highlight.add(range);
          ranges.push(range);
        }
      }
      return () => {
        for (const range of ranges) highlight.delete(range);
      };
    },
    [query],
  );
}

