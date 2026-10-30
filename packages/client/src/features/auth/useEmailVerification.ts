'use client';

import { ApiResponseError, ErrorCode } from '@cityborn/api';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { type RefObject, useEffect, useRef, useState } from 'react';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import { invalidateCurrentUser } from '../../domains/auth/authQueries';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../shared/errorReporter';

export type EmailVerificationStatus =
  | 'verifying'
  | 'verified'
  | 'expired'
  | 'invalid'
  | 'renewed';

export type EmailVerificationOptions = {
  verificationToken: string;
};

export type EmailVerification = {
  status: EmailVerificationStatus;
  renew: () => Promise<void>;
};

export function useEmailVerification({
  verificationToken,
}: EmailVerificationOptions): EmailVerification {
  const { authApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const verifiedToken: RefObject<string | null> = useRef<string | null>(null);
  const [status, setStatus] = useState<EmailVerificationStatus>('verifying');

  useEffect(() => {
    if (verifiedToken.current === verificationToken) return;
    verifiedToken.current = verificationToken;

    if (!verificationToken) {
      setStatus('invalid');
      return;
    }

    const verify = async (): Promise<void> => {
      setStatus('verifying');
      try {
        await authApi.verifyEmail({ verification_token: verificationToken });
        await invalidateCurrentUser(queryClient);
        setStatus('verified');
      } catch (error: unknown) {
        setStatus(
          error instanceof ApiResponseError &&
            error.code === ErrorCode.USER_VERIFICATION_EMAIL_EXPIRED_TOKEN
            ? 'expired'
            : 'invalid',
        );
      }
    };
    verify();
  }, [authApi, queryClient, verificationToken]);

  const renew = async (): Promise<void> => {
    try {
      await authApi.renewVerificationEmail({
        verification_token: verificationToken,
      });
      setStatus('renewed');
    } catch (error: unknown) {
      reportError(error);
    }
  };

  return { status, renew };
}
