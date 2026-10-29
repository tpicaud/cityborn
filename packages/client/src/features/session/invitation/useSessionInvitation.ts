'use client';

import type { Session } from '@cityborn/api';
import { useState } from 'react';
import type { Sharing, SharingResult } from '../../../platform/sharing';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../../shared/errorReporter';
import { createSessionInvitation } from './sessionInvitation';

export type SessionInvitationOptions = {
  session: Pick<Session, 'id' | 'mode'>;
  sharing: Sharing;
};

export type SessionInvitation = {
  invite: () => Promise<void>;
  copyCode: () => Promise<void>;
  result: SharingResult | null;
  codeCopied: boolean;
};

export function useSessionInvitation({
  session,
  sharing,
}: SessionInvitationOptions): SessionInvitation {
  const { reportError }: ErrorReporter = useErrorReporter();
  const [result, setResult] = useState<SharingResult | null>(null);
  const [codeCopied, setCodeCopied] = useState<boolean>(false);

  const invite = async (): Promise<void> => {
    setResult(null);
    try {
      setResult(
        await sharing.share(
          createSessionInvitation({ session, webAppUrl: sharing.webAppUrl() }),
        ),
      );
    } catch (error: unknown) {
      reportError(error, 'Impossible de partager le lien. Réessayez.');
    }
  };

  const copyCode = async (): Promise<void> => {
    setCodeCopied(false);
    try {
      await sharing.copy(session.id);
      setCodeCopied(true);
    } catch (error: unknown) {
      reportError(error, 'Impossible de copier le code. Réessayez.');
    }
  };

  return { invite, copyCode, result, codeCopied };
}
