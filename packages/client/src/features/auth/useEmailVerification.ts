'use client';

import type { VerifyEmailData } from '@cityborn/api';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import { invalidateCurrentUser } from '../../domains/auth/authQueries';

export type EmailVerification = {
  verifyEmail: (data: VerifyEmailData) => Promise<void>;
};

export function useEmailVerification(): EmailVerification {
  const { authApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();

  const verifyEmail: (data: VerifyEmailData) => Promise<void> = useCallback(
    async (data: VerifyEmailData): Promise<void> => {
      await authApi.verifyEmail(data);
      await invalidateCurrentUser(queryClient);
    },
    [authApi, queryClient],
  );

  return { verifyEmail };
}
