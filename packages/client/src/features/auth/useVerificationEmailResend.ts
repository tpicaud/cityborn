'use client';

import type { UserId } from '@cityborn/api';
import { useState } from 'react';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../shared/errorReporter';
import { type CurrentUser, useCurrentUser } from './authContext';

export type VerificationEmailResend = {
  isSending: boolean;
  isSent: boolean;
  resend: () => Promise<void>;
};

export function useVerificationEmailResend(): VerificationEmailResend {
  const { authApi }: DomainApis = useDomainApis();
  const { reportError }: ErrorReporter = useErrorReporter();
  const { user }: CurrentUser = useCurrentUser();
  const [isSending, setIsSending] = useState<boolean>(false);
  const [verificationEmailRecipientId, setVerificationEmailRecipientId] =
    useState<UserId | null>(null);
  const isSent: boolean =
    user !== null && verificationEmailRecipientId === user.id;

  const resend = async (): Promise<void> => {
    setIsSending(true);
    try {
      await authApi.resendVerificationEmail();
      setVerificationEmailRecipientId(user?.id ?? null);
    } catch (error: unknown) {
      reportError(error);
    } finally {
      setIsSending(false);
    }
  };

  return { isSending, isSent, resend };
}
