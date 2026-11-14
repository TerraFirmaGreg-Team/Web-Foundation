import { ImageResponse } from 'next/og';
import { OgOrbit } from '../components/og-orbit';
import type { OgBrand } from './og';

export function ogRootResponse(
  brand: OgBrand,
  description?: string,
): ImageResponse {
  return new ImageResponse(<OgOrbit {...brand} description={description} />, {
    width: 1200,
    height: 630,
  });
}
