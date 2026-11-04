'use client';

import { Copy } from 'lucide-react';
import type { ReactNode } from 'react';
import { CopyMenu } from '@terrafirmagreg-team/ui/components/blocks/nav/copy-menu';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';

export function CopyIdMenu({
  id,
  nbt,
  label,
  extra,
  children,
}: {
  id: string;

  nbt?: string;

  label?: string;

  extra?: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations();
  return (
    <CopyMenu
      items={[
        {
          icon: <Copy />,
          label: label ?? t('Copy id', { note: 'ui.entry.copy' }),
          value: id,
        },
        ...(nbt
          ? [
              {
                label: t('Copy stack id', { note: 'ui.entry.copy_stack' }),
                value: `${id}${nbt}`,
              },
              { label: t('Copy NBT', { note: 'ui.entry.copy_nbt' }), value: nbt },
            ]
          : []),
      ]}
      extra={extra}
    >
      {children}
    </CopyMenu>
  );
}
