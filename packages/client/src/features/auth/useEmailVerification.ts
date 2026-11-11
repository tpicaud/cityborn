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

type EmailVerificationStatus =
  | 'verifying'
  | 'verified'
  | 'expired'
  | 'invalid'
  | 'renewed';

export type EmailVerificationContent = {
  title: string;
  message: string;
  pending: boolean;
  renewable: boolean;
};

const emailVerificationContents: Record<
  EmailVerificationStatus,
  EmailVerificationContent
> = {
  verifying: {
    title: 'Vérification',
    message: 'Validation de ton adresse e-mail en cours…',
    pending: true,
    renewable: false,
  },
  verified: {
    title: 'E-mail vérifié',
    message: 'Ton adresse e-mail est maintenant vérifiée.',
    pending: false,
    renewable: false,
  },
  expired: {
    title: 'Lien expiré',
    message:
      'Ce lien a expiré. Demande un nouveau lien pour vérifier ton adresse e-mail.',
    pending: false,
    renewable: true,
  },
  invalid: {
    title: 'Vérification impossible',
    message: 'Le lien de vérification est invalide ou a déjà été utilisé.',
    pending: false,
    renewable: false,
  },
  renewed: {
    title: 'Vérifie tes e-mails',
    message: 'Un nouveau lien de vérification vient de t’être envoyé.',
    pending: false,
    renewable: false,
  },
};

export type EmailVerificationOptions = {
  verificationToken: string;
};

export type EmailVerification = {
  content: EmailVerificationContent;
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

  return { content: emailVerificationContents[status], renew };
}
