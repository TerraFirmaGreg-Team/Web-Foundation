'use client';

import { createElement } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useCommentsEnabled } from './use-enabled';
import { useCommentsSession } from './use-session';
import {
  redirectToCommentsLogin,
  redirectToCommentsLogout,
} from '../../lib/comments/auth';
import type { SiteMenuItem } from '@terrafirmagreg-team/ui/components/blocks/nav/site-menu';

const COMMENTS_API = '/api/comments';

export function useCommentsMenuItem(): SiteMenuItem | false {
  const t = useTranslations();
  const enabled = useCommentsEnabled(`${COMMENTS_API}/config`);
  const { session } = useCommentsSession(COMMENTS_API, { enabled });
  if (!enabled) return false;
  return {
    label: session ? t('Sign out', { note: 'ui.sign_out' }) : t('Sign in', { note: 'ui.sign_in' }),
    icon: session ? createElement(LogOut) : createElement(LogIn),
    onClick: session
      ? () => redirectToCommentsLogout(COMMENTS_API)
      : () => redirectToCommentsLogin(COMMENTS_API),
  };
}

