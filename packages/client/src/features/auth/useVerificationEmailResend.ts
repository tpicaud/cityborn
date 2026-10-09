'use client';

import { useState } from 'react';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import { useError } from '../../shared/errorContext';

export type VerificationEmailResend = {
  isSending: boolean;
  isSent: boolean;
  resend: () => Promise<void>;
};

export function useVerificationEmailResend(): VerificationEmailResend {
  const { authApi }: DomainApis = useDomainApis();
  const { invokeError } = useError();
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);

  const resend = async (): Promise<void> => {
    setIsSending(true);
    try {
      await authApi.resendVerificationEmail();
      setIsSent(true);
    } catch (error: unknown) {
      invokeError(error);
    } finally {
      setIsSending(false);
    }
  };

  return { isSending, isSent, resend };
}
