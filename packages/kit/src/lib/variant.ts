const VARIANT_PREFIX = '~';

export function variantSegment(params: URLSearchParams): string {
  return `${VARIANT_PREFIX}${encodeURIComponent(params.toString())}`;
}

export function splitLandingSlug(
  slug: string[] | undefined,
): { dataset?: string; variant?: URLSearchParams } {
  const [ref, marker, ...rest] = slug ?? [];
  if (!ref || rest.length) return {};
  if (marker !== undefined && !marker.startsWith(VARIANT_PREFIX)) return {};
  let variant: URLSearchParams | undefined;
  if (marker) {
    const raw = marker.slice(VARIANT_PREFIX.length);
    let decoded: string;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      decoded = raw;
    }
    variant = new URLSearchParams(decoded);
  }
  return { dataset: ref, variant };
}
