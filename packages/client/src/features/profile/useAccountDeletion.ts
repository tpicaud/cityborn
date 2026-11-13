'use client';

import { useState } from 'react';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../shared/errorReporter';
import { type SignOut, useSignOut } from '../auth/useSignOut';

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
  const { reportError }: ErrorReporter = useErrorReporter();
  const [isConfirmationOpen, setIsConfirmationOpen] = useState<boolean>(false);
  const { signOut: signOutDeletedAccount }: SignOut = useSignOut({
    onSignedOut: () => {
      setIsConfirmationOpen(false);
      onAccountDeleted?.();
    },
  });

  const deleteAccount = async (): Promise<void> => {
    try {
      await authApi.deleteUser();
    } catch (error: unknown) {
      reportError(error);
      return;
    }
    await signOutDeletedAccount();
  };

  return {
    isConfirmationOpen,
    openConfirmation: () => setIsConfirmationOpen(true),
    closeConfirmation: () => setIsConfirmationOpen(false),
    deleteAccount,
  };
}
