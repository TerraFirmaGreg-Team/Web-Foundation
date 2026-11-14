import { sectionTabs } from '@terrafirmagreg-team/sites';
import type { SectionKey } from '@terrafirmagreg-team/sites/location';
import { sectionConfig } from '@terrafirmagreg-team/kit/lib/config';
import { ogSectionIcon } from '../lib/og-icon';
import type { OgBrand } from '../lib/og';

const BG = '#121212';
const BORDER = 'rgba(102,102,102,0.35)';
const MUTED = 'rgba(178,178,178,0.8)';
const CHIP_BG = '#26262a';

export type OgOrbitProps = OgBrand & { description?: string };

function SectionGlyph({ section, size }: { section: SectionKey; size: number }) {
  const accent = sectionConfig().sectionAccent?.[section] ?? '#ff96ff';
  const icon = ogSectionIcon(section, accent);
  // eslint-disable-next-line @next/next/no-img-element -- ImageResponse requires img
  if (icon) return <img src={icon} width={size} height={size} alt="" />;
  return (
    <div
      style={{
        display: 'flex',
        width: Math.round(size * 0.45),
        height: Math.round(size * 0.45),
        backgroundColor: accent,
      }}
    />
  );
}

export function OgOrbit({ logo, site, siteUrl, description }: OgOrbitProps) {
  const host = new URL(siteUrl).host;
  const cx = 300;
  const cy = 315;
  const r = 195;
  const dots = sectionTabs.map((tab, i) => {
    const angle = -90 + i * 72;
    const rad = (angle * Math.PI) / 180;
    return {
      key: tab.key,
      accent: sectionConfig().sectionAccent?.[tab.key] ?? '#ff96ff',
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  });
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        color: 'white',
        backgroundColor: BG,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: 600,
          height: '100%',
          padding: '72px 64px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse requires img */}
          <img src={logo} width={64} height={64} alt="" />
          <p style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>
            TerraFirmaGreg
          </p>
        </div>
        <p
          style={{
            fontSize: 84,
            fontWeight: 800,
            margin: 0,
            marginTop: 'auto',
            lineHeight: 1,
          }}
        >
          {site}
        </p>
        <p
          style={{
            fontSize: 30,
            color: MUTED,
            margin: 0,
            marginTop: 20,
            lineHeight: 1.3,
          }}
        >
          {description}
        </p>
        <p style={{ fontSize: 26, color: MUTED, margin: 0, marginTop: 48 }}>
          {host}
        </p>
      </div>
      <div
        style={{
          display: 'flex',
          position: 'relative',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            left: cx - r - 8,
            top: cy - r - 8,
            width: (r + 8) * 2,
            height: (r + 8) * 2,
            borderRadius: 999,
            border: `3px dashed ${BORDER}`,
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse requires img */}
        <img src={logo} width={230} height={230} alt="" />
        {dots.map((s) => (
          <div
            key={s.key}
            style={{
              display: 'flex',
              position: 'absolute',
              left: s.x - 34,
              top: s.y - 34,
              width: 68,
              height: 68,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: CHIP_BG,
              border: `4px solid ${s.accent}`,
            }}
          >
            <SectionGlyph section={s.key} size={32} />
          </div>
        ))}
      </div>
    </div>
  );
}
