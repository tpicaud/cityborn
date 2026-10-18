'use client';

import { useState } from 'react';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../shared/errorReporter';

export type VerificationEmailResend = {
  isSending: boolean;
  isSent: boolean;
  resend: () => Promise<void>;
};

export function useVerificationEmailResend(): VerificationEmailResend {
  const { authApi }: DomainApis = useDomainApis();
  const { reportError }: ErrorReporter = useErrorReporter();
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);

  const resend = async (): Promise<void> => {
    setIsSending(true);
    try {
      await authApi.resendVerificationEmail();
      setIsSent(true);
    } catch (error: unknown) {
      reportError(error);
    } finally {
      setIsSending(false);
    }
  };

  return { isSending, isSent, resend };
}
