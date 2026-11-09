import type { ReactNode } from 'react';
import { MC_FORMAT } from '@terrafirmagreg-team/dump/lib/dump/contract/text';
import { FormatText } from '@terrafirmagreg-team/ui/components/blocks/text/format-text';
import type { OGSprite } from '../lib/og';

export type OgDockProps = {
  title: ReactNode;
  description?: ReactNode;
  site?: ReactNode;
  accent: string;
  logo?: string;
  section?: string;
  sprite?: OGSprite;
  icon?: string;
  badge?: string;
  version?: string;
  siteUrl?: string;
  entity?: { kind: string; name: string; id?: string; format?: string };
};

const BG = '#121212';
const CARD = '#191919';
const PANEL = '#1f1f1f';
const BORDER = 'rgba(102,102,102,0.35)';
const MUTED = 'rgba(178,178,178,0.8)';
const CHIP_BG = '#26262a';
const CHIP_BORDER = '#3a3a40';

function cap(value?: string): string | undefined {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function EntityName(props: OgDockProps) {
  if (!props.entity) return <>{props.title}</>;
  return (
    <span style={{ display: 'flex', flexWrap: 'wrap', whiteSpace: 'pre-wrap' }}>
      <FormatText
        text={props.entity.format ?? props.entity.name}
        format={MC_FORMAT}
      />
    </span>
  );
}

function MetaChip({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '5px 14px',
        backgroundColor: CHIP_BG,
        border: `2px solid ${CHIP_BORDER}`,
        borderRadius: 8,
      }}
    >
      <p style={{ fontSize: 22, margin: 0, color: MUTED }}>{children}</p>
    </div>
  );
}

export const SECTION_ACCENT: Record<string, string> = {
  docs: '#6ea8ff',
  guide: '#7dd87d',
  recipe: '#ffb347',
  quest: '#ff96ff',
  changelog: '#b49aff',
};

export const SECTION_PAGE_KIND: Record<string, string> = {
  changelog: 'release',
};

function BrandLogo({ logo, size = 56 }: { logo?: string; size?: number }) {
  if (!logo) return null;
  // eslint-disable-next-line @next/next/no-img-element -- ImageResponse requires img
  return <img src={logo} width={size} height={size} alt="" />;
}

function SectionIcon({
  icon,
  accent,
  size = 30,
}: {
  icon?: string;
  accent: string;
  size?: number;
}) {
  if (icon) {
    // eslint-disable-next-line @next/next/no-img-element -- ImageResponse requires img
    return <img src={icon} width={size} height={size} alt="" />;
  }
  return (
    <div
      style={{
        width: Math.round(size * 0.45),
        height: Math.round(size * 0.45),
        backgroundColor: accent,
        display: 'flex',
      }}
    />
  );
}

function SpriteTile({ sprite, size }: { sprite: OGSprite; size: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- ImageResponse requires img
    <img
      src={sprite.url}
      width={size}
      height={size}
      alt=""
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

function ItemSlot({
  sprite,
  logo,
  size = 200,
}: {
  sprite?: OGSprite;
  logo?: string;
  size?: number;
}) {
  const border = Math.max(3, Math.round(size * 0.018));
  const inner = Math.floor(size * 0.74);
  return (
    <div
      style={{
        display: 'flex',
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: CHIP_BG,
        border: `${border}px solid ${CHIP_BORDER}`,
        borderRadius: Math.max(4, Math.round(size * 0.03)),
      }}
    >
      {sprite ? (
        <SpriteTile sprite={sprite} size={inner} />
      ) : (
        <BrandLogo logo={logo} size={inner} />
      )}
    </div>
  );
}

function ChipCell({
  size,
  selected,
  accent,
  children,
}: {
  size: number;
  selected?: boolean;
  accent?: string;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: CHIP_BG,
        border: `3px solid ${selected ? accent : CHIP_BORDER}`,
        borderRadius: 6,
      }}
    >
      {children}
    </div>
  );
}

export function OgDock(props: OgDockProps) {
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
          width: 400,
          backgroundColor: CARD,
          borderRight: `6px solid ${props.accent}`,
          padding: '48px 40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SectionMotif
            section={props.section}
            sprite={props.sprite}
            accent={props.accent}
            logo={props.logo}
          />
        </div>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '14px' }}
        >
          <SectionIcon icon={props.icon} accent={props.accent} size={34} />
          <p
            style={{
              fontSize: '32px',
              fontWeight: 700,
              margin: 0,
              color: props.accent,
            }}
          >
            {cap(props.section)}
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '14px',
          }}
        >
          {props.badge && (
            <p style={{ fontSize: '26px', margin: 0, color: MUTED }}>
              {props.badge}
            </p>
          )}
          {props.badge && props.version && (
            <p style={{ fontSize: '26px', margin: 0, color: MUTED }}>·</p>
          )}
          {props.version && <MetaChip>{props.version}</MetaChip>}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: '56px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <BrandLogo logo={props.logo} size={96} />
          <p style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>
            {props.site}
          </p>
          <p style={{ fontSize: '28px', margin: 0, color: MUTED }}>·</p>
          <p style={{ fontSize: '28px', margin: 0, color: MUTED }}>
            TerraFirmaGreg
          </p>
        </div>
        {props.entity?.kind && (
          <p
            style={{
              fontSize: '28px',
              fontWeight: 700,
              margin: 0,
              marginTop: '36px',
              color: props.accent,
            }}
          >
            {props.entity.kind}
          </p>
        )}
        <p
          style={{
            fontWeight: 800,
            fontSize: '58px',
            margin: 0,
            marginTop: props.entity?.kind ? '14px' : '44px',
            lineHeight: 1.06,
            display: 'flex',
          }}
        >
          <EntityName {...props} />
        </p>
        <p
          style={{
            fontSize: '30px',
            color: MUTED,
            margin: 0,
            marginTop: '18px',
            lineHeight: 1.3,
          }}
        >
          {props.description}
        </p>
        <p
          style={{ fontSize: '26px', margin: 0, marginTop: 'auto', color: MUTED }}
        >
          {props.siteUrl}
        </p>
      </div>
    </div>
  );
}

function MotifCraft({
  sprite,
  accent,
  logo,
}: {
  sprite?: OGSprite;
  accent: string;
  logo?: string;
}) {
  const cell = 88;
  const gap = 8;
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        width: cell * 3 + gap * 2,
        gap,
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <ChipCell key={i} size={cell} selected={i === 4} accent={accent}>
          {i === 4 &&
            (sprite ? (
              <SpriteTile sprite={sprite} size={Math.floor(cell * 0.72)} />
            ) : (
              <BrandLogo logo={logo} size={Math.floor(cell * 0.72)} />
            ))}
        </ChipCell>
      ))}
    </div>
  );
}

function MotifQuest({
  sprite,
  accent,
  logo,
}: {
  sprite?: OGSprite;
  accent: string;
  logo?: string;
}) {
  const nodes = [
    { x: 22, y: 26, s: 38 },
    { x: 100, y: 16, s: 38 },
    { x: 28, y: 150, s: 38 },
    { x: 116, y: 160, s: 38 },
    { x: 238, y: 168, s: 38 },
    { x: 172, y: 62, s: 104, hot: true },
  ];
  const links = [
    [0, 1],
    [1, 5],
    [0, 2],
    [2, 3],
    [3, 5],
    [5, 4],
  ];
  const center = (n: { x: number; y: number; s: number }) => [
    n.x + n.s / 2,
    n.y + n.s / 2,
  ];
  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width: 300,
        height: 230,
        backgroundColor: CARD,
        border: `3px solid ${BORDER}`,
        borderRadius: 10,
      }}
    >
      {links.map(([a, b], i) => {
        const [x1, y1] = center(nodes[a]);
        const [x2, y2] = center(nodes[b]);
        const len = Math.hypot(x2 - x1, y2 - y1);
        const deg = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              position: 'absolute',
              left: (x1 + x2) / 2 - len / 2,
              top: (y1 + y2) / 2 - 2,
              width: len,
              height: 4,
              backgroundColor: BORDER,
              transform: `rotate(${deg}deg)`,
            }}
          />
        );
      })}
      {nodes.map((n, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            position: 'absolute',
            left: n.x,
            top: n.y,
            width: n.s,
            height: n.s,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: PANEL,
            border: `4px solid ${n.hot ? accent : CHIP_BORDER}`,
          }}
        >
          {n.hot &&
            (sprite ? (
              <SpriteTile sprite={sprite} size={Math.floor(n.s * 0.55)} />
            ) : (
              <BrandLogo logo={logo} size={Math.floor(n.s * 0.55)} />
            ))}
        </div>
      ))}
    </div>
  );
}

function MotifGuide({
  sprite,
  accent,
  logo,
}: {
  sprite?: OGSprite;
  accent: string;
  logo?: string;
}) {
  const page = 140;
  const height = 210;
  return (
    <div style={{ display: 'flex' }}>
      <div
        style={{
          display: 'flex',
          width: page,
          height,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: CARD,
          border: `3px solid ${BORDER}`,
          borderTopLeftRadius: 10,
          borderBottomLeftRadius: 10,
        }}
      >
        {sprite ? (
          <SpriteTile sprite={sprite} size={Math.floor(page * 0.55)} />
        ) : (
          <BrandLogo logo={logo} size={Math.floor(page * 0.55)} />
        )}
      </div>
      <div style={{ display: 'flex', width: 6, height, backgroundColor: accent }} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: page,
          height,
          justifyContent: 'center',
          gap: 16,
          backgroundColor: PANEL,
          border: `3px solid ${BORDER}`,
          borderLeft: 'none',
          borderTopRightRadius: 10,
          borderBottomRightRadius: 10,
          padding: '0 22px',
        }}
      >
        <div style={{ display: 'flex', height: 8, width: '80%', backgroundColor: BORDER }} />
        <div style={{ display: 'flex', height: 8, width: '100%', backgroundColor: BORDER }} />
        <div style={{ display: 'flex', height: 8, width: '60%', backgroundColor: BORDER }} />
      </div>
    </div>
  );
}

function MotifChangelog({ accent }: { accent: string }) {
  const rows = [
    { dot: accent, w1: '85%', w2: '60%', hot: true },
    { dot: BORDER, w1: '95%', w2: '50%', hot: false },
    { dot: BORDER, w1: '80%', w2: '70%', hot: false },
  ];
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: 240,
        height: 260,
        gap: 18,
        backgroundColor: CARD,
        border: `3px solid ${BORDER}`,
        padding: '26px 24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
            }}
          >
            <div
              style={{
                display: 'flex',
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: r.dot,
                flexShrink: 0,
              }}
            />
            {i < rows.length - 1 && (
              <div
                style={{
                  display: 'flex',
                  flex: 1,
                  width: 4,
                  marginTop: 10,
                  backgroundColor: BORDER,
                }}
              />
            )}
          </div>
        ))}
      </div>
      <div
        style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
      >
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              flex: 1,
            }}
          >
            <div
              style={{
                display: 'flex',
                height: 9,
                width: r.w1,
                backgroundColor: r.hot ? accent : BORDER,
              }}
            />
            <div
              style={{
                display: 'flex',
                height: 8,
                width: r.w2,
                backgroundColor: BORDER,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function MotifDoc({ accent }: { accent: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 190,
        height: 250,
        gap: 18,
        backgroundColor: CARD,
        border: `3px solid ${BORDER}`,
        padding: '28px 24px',
      }}
    >
      <div style={{ display: 'flex', height: 10, width: '55%', backgroundColor: accent }} />
      <div style={{ display: 'flex', height: 8, width: '100%', backgroundColor: BORDER }} />
      <div style={{ display: 'flex', height: 8, width: '100%', backgroundColor: BORDER }} />
      <div style={{ display: 'flex', height: 8, width: '70%', backgroundColor: BORDER }} />
      <div style={{ display: 'flex', height: 8, width: '85%', backgroundColor: BORDER }} />
    </div>
  );
}

function SectionMotif({
  section,
  sprite,
  accent,
  logo,
}: {
  section?: string;
  sprite?: OGSprite;
  accent: string;
  logo?: string;
}) {
  if (section === 'recipe')
    return <MotifCraft sprite={sprite} accent={accent} logo={logo} />;
  if (section === 'quest')
    return <MotifQuest sprite={sprite} accent={accent} logo={logo} />;
  if (section === 'guide')
    return <MotifGuide sprite={sprite} accent={accent} logo={logo} />;
  if (section === 'changelog') return <MotifChangelog accent={accent} />;
  if (section === 'docs') return <MotifDoc accent={accent} />;
  return <ItemSlot sprite={sprite} logo={logo} size={210} />;
}
