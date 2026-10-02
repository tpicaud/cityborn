'use client';

import type { ApiResult } from '@cityborn/api';
import { useState } from 'react';
import { useError } from '../../shared/errorContext';
import type { AuthApi } from './authApi';

export type VerificationEmailResend = {
  isSending: boolean;
  isSent: boolean;
  resend: () => Promise<void>;
};

export function useVerificationEmailResend(
  authApi: AuthApi,
): VerificationEmailResend {
  const { invokeError } = useError();
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);

  const resend = async (): Promise<void> => {
    setIsSending(true);
    try {
      const result: ApiResult<void> = await authApi.resendVerificationEmail();
      if (!result.ok) return invokeError(result.error);
      setIsSent(true);
    } catch (error: unknown) {
      invokeError(error);
    } finally {
      setIsSending(false);
    }
  };

  return { isSending, isSent, resend };
}
