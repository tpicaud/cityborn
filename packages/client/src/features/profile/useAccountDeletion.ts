'use client';

import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import { clearCacheAfterSignOut } from '../../domains/auth/authQueries';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../shared/errorReporter';

export type AccountDeletionOptions = {
  onAccountDeleted?: () => void;
};

export type AccountDeletion = {
  isConfirmationOpen: boolean;
  openConfirmation: () => void;
  closeConfirmation: () => void;
  deleteAccount: () => Promise<void>;
};

export function useAccountDeletion({
  onAccountDeleted,
}: AccountDeletionOptions = {}): AccountDeletion {
  const { authApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const [isConfirmationOpen, setIsConfirmationOpen] = useState<boolean>(false);

  const deleteAccount = async (): Promise<void> => {
    try {
      await authApi.deleteUser();
    } catch (error: unknown) {
      reportError(error);
      return;
    }
    try {
      await authApi.signOut();
    } catch (error: unknown) {
      reportError(error);
    }
    await clearCacheAfterSignOut(queryClient);
    setIsConfirmationOpen(false);
    onAccountDeleted?.();
  };

  return {
    isConfirmationOpen,
    openConfirmation: () => setIsConfirmationOpen(true),
    closeConfirmation: () => setIsConfirmationOpen(false),
    deleteAccount,
  };
}
