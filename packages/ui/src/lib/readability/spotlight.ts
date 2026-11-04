'use client';
import type { SpotlightStyle } from '@terrafirmagreg-team/ui/types/readability';

const UNIT_SELECTOR =
  'figure, table, blockquote, details, ul, ol, video, iframe, .codeblock';
const PHRASING_SELECTOR =
  'a, abbr, area, audio, b, bdi, bdo, br, button, canvas, cite, code, ' +
  'data, datalist, del, dfn, em, embed, i, iframe, img, input, ins, kbd, ' +
  'label, map, mark, math, meter, noscript, object, output, picture, ' +
  'progress, q, rp, rt, ruby, s, samp, script, select, slot, small, span, ' +
  'strong, sub, sup, svg, template, textarea, time, u, var, video, wbr';
const MEDIA_SELECTOR = 'img, svg, video, canvas, audio, picture';

export function contentRoot(): HTMLElement | null {
  return document.getElementById('page')?.parentElement ?? null;
}

function isBlockish(el: HTMLElement): boolean {
  const display = getComputedStyle(el).display;
  return !display.startsWith('inline') && display !== 'none';
}

function isStructural(el: HTMLElement): boolean {
  if (el.matches(MEDIA_SELECTOR)) return false;
  for (const child of el.children) {
    if (!child.matches(PHRASING_SELECTOR)) return true;
  }
  return false;
}

function hasDirectText(el: HTMLElement): boolean {
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
      return true;
  }
  return false;
}

function isInteractive(el: HTMLElement): boolean {
  const tag = el.tagName;
  if (tag !== 'A' && tag !== 'BUTTON' && el.getAttribute('role') !== 'button')
    return false;
  const parent = el.parentElement;
  if (!parent) return false;
  return !hasDirectText(parent);
}

function isBoundary(el: HTMLElement, root: HTMLElement): boolean {
  return (
    el === root ||
    el.parentElement === root ||
    el.matches('article, nav, .prose, #toc')
  );
}

function isUnit(el: HTMLElement): boolean {
  if (isStructural(el)) return true;
  if (hasDirectText(el)) return true;
  return el.matches(UNIT_SELECTOR);
}

function closestBlock(el: HTMLElement, root: HTMLElement): HTMLElement | null {
  const found = el.closest(UNIT_SELECTOR);
  return found instanceof HTMLElement && root.contains(found) ? found : null;
}

function findElementToBeHighlighted(
  element: HTMLElement | null,
  rootContainer: HTMLElement,
): HTMLElement | null {
  if (!element) return null;
  const isAncestorValid = (current: HTMLElement | null): boolean => {
    if (!current || current === rootContainer) return false;
    const parent = current.parentElement;
    if (!parent) return false;
    if (parent === rootContainer) return true;
    const parentDisplay = getComputedStyle(parent).display;
    if (
      parentDisplay.startsWith('inline') ||
      parentDisplay === 'none' ||
      hasDirectText(parent)
    )
      return false;
    if (parent.tagName === 'DIV') {
      if (parent.classList.contains('codeblock')) return false;
      for (const child of parent.children) {
        if (child.tagName === 'PRE') return false;
      }
    }
    if (
      parent.tagName === 'LI' &&
      current.tagName !== 'P' &&
      !isBlockish(current)
    ) {
      return false;
    }
    return isAncestorValid(parent);
  };
  return isAncestorValid(element)
    ? element
    : findElementToBeHighlighted(element.parentElement, rootContainer);
}

function interactiveUnit(
  el: HTMLElement,
  root: HTMLElement,
): HTMLElement | null {
  let current: HTMLElement | null = el;
  while (current && !isBoundary(current, root)) {
    if (isInteractive(current) && isStructural(current)) return current;
    current = current.parentElement;
  }
  return null;
}

function resolveAside(el: HTMLElement, root: HTMLElement): HTMLElement | null {
  const block = closestBlock(el, root);
  if (block) return block;
  const unit = interactiveUnit(el, root);
  if (unit) return unit;
  const found = findElementToBeHighlighted(el, root);
  if (!found || isBoundary(found, root)) return null;
  if (isStructural(found) && found.tagName !== 'A' && found.tagName !== 'BUTTON')
    return null;
  return found;
}

function resolveUnder(el: HTMLElement, root: HTMLElement): HTMLElement | null {
  let interactive: HTMLElement | null = null;
  let current: HTMLElement | null = el;
  while (current && !isBoundary(current, root)) {
    if (isInteractive(current)) interactive = current;
    current = current.parentElement;
  }
  if (interactive) return interactive;
  current = el;
  let leaf: HTMLElement | null = null;
  while (current && !isBoundary(current, root)) {
    const leafish = isBlockish(current) && !isStructural(current);
    if (!leafish && leaf) return leaf;
    const inText =
      current.parentElement && hasDirectText(current.parentElement);
    if (leafish && !inText) leaf = current;
    if (
      !inText &&
      isUnit(current) &&
      !current.matches(PHRASING_SELECTOR)
    )
      return current;
    current = current.parentElement;
  }
  if (leaf) return leaf;
  const found = findElementToBeHighlighted(el, root);
  return found && !isBoundary(found, root) ? found : null;
}

export function resolveSpotlight(
  el: HTMLElement,
  root: HTMLElement,
  style: SpotlightStyle,
): HTMLElement | null {
  return style === 'under' ? resolveUnder(el, root) : resolveAside(el, root);
}

export function rowBand(
  el: HTMLElement,
  root: HTMLElement,
  style: SpotlightStyle,
): { top: number; left: number; width: number; height: number } | null {
  if (style !== 'aside' || el.tagName === 'P') return null;
  const parent = el.parentElement;
  if (!parent || parent === root) return null;
  const rect = el.getBoundingClientRect();
  let top = rect.top;
  let bottom = rect.bottom;
  for (const child of parent.children) {
    if (child === el || !(child instanceof HTMLElement)) continue;
    const r = child.getBoundingClientRect();
    if (r.height === 0 || r.top >= rect.bottom || r.bottom <= rect.top)
      continue;
    top = Math.min(top, r.top);
    bottom = Math.max(bottom, r.bottom);
  }
  const pr = parent.getBoundingClientRect();
  return { top, left: pr.left, width: pr.width, height: bottom - top };
}

