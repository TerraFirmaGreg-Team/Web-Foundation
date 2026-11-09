import { ImageResponse } from 'next/og';
import { OgDock } from '../components/og-dock';
import type { OgBrand } from './og';

export function ogDefaultResponse(
  brand: OgBrand,
  title: string,
  description?: string,
): ImageResponse {
  return new ImageResponse(
    <OgDock
      title={title}
      description={description}
      site={brand.site}
      accent="#ff96ff"
      logo={brand.logo}
      siteUrl={new URL(brand.siteUrl).host}
    />,
    { width: 1200, height: 630 },
  );
}
