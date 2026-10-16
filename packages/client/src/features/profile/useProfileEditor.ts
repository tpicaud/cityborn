'use client';

import type { User } from '@cityborn/api';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../shared/errorReporter';
import type { FormSubmitHandler } from '../../shared/formSubmitHandler';
import { setCurrentUser } from '../auth/api/authQueries';
import { type CurrentUser, useCurrentUser } from '../auth/authContext';
import { type SignOut, useSignOut } from '../auth/useSignOut';
import {
  type ChangePasswordForm,
  toUpdatePassword,
  type UsernameForm,
  useChangePasswordForm,
  useUsernameForm,
} from './profileForms';

export type ProfileEditorOptions = {
  onAccountDeleted?: () => void;
};

export type ProfileEditor = {
  usernameForm: UsernameForm;
  isEditingUsername: boolean;
  startUsernameEdit: () => void;
  cancelUsernameEdit: () => void;
  submitUsername: FormSubmitHandler;
  passwordForm: ChangePasswordForm;
  isPasswordDialogOpen: boolean;
  isPasswordUpdated: boolean;
  openPasswordDialog: () => void;
  closePasswordDialog: () => void;
  submitPassword: FormSubmitHandler;
  isDeleteAccountDialogOpen: boolean;
  openDeleteAccountDialog: () => void;
  closeDeleteAccountDialog: () => void;
  deleteAccount: () => Promise<void>;
};

export function useProfileEditor({
  onAccountDeleted,
}: ProfileEditorOptions = {}): ProfileEditor {
  const { authApi, profileApi }: DomainApis = useDomainApis();
  const { user }: CurrentUser = useCurrentUser();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const usernameForm: UsernameForm = useUsernameForm(user?.username ?? '');
  const passwordForm: ChangePasswordForm = useChangePasswordForm();
  const [isEditingUsername, setIsEditingUsername] = useState<boolean>(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] =
    useState<boolean>(false);
  const [isPasswordUpdated, setIsPasswordUpdated] = useState<boolean>(false);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] =
    useState<boolean>(false);
  const { signOut: signOutDeletedAccount }: SignOut = useSignOut({
    onSignedOut: () => {
      setIsDeleteAccountDialogOpen(false);
      onAccountDeleted?.();
    },
  });

  const submitUsername: FormSubmitHandler = usernameForm.handleSubmit(
    async (data) => {
      try {
        const updatedUser: User = await profileApi.updateUsername(data);
        await setCurrentUser({ queryClient, user: updatedUser });
        usernameForm.reset({ username: updatedUser.username });
        setIsEditingUsername(false);
      } catch (error: unknown) {
        reportError(error);
      }
    },
  );

  const cancelUsernameEdit = (): void => {
    usernameForm.reset({ username: user?.username ?? '' });
    setIsEditingUsername(false);
  };

  const closePasswordDialog = (): void => {
    passwordForm.reset();
    setIsPasswordUpdated(false);
    setIsPasswordDialogOpen(false);
  };

  const submitPassword: FormSubmitHandler = passwordForm.handleSubmit(
    async (values) => {
      try {
        const updatedUser: User = await authApi.updatePassword(
          toUpdatePassword(values),
        );
        await setCurrentUser({ queryClient, user: updatedUser });
        passwordForm.reset();
        setIsPasswordUpdated(true);
      } catch (error: unknown) {
        reportError(error);
      }
    },
  );

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
    usernameForm,
    isEditingUsername,
    startUsernameEdit: () => setIsEditingUsername(true),
    cancelUsernameEdit,
    submitUsername,
    passwordForm,
    isPasswordDialogOpen,
    isPasswordUpdated,
    openPasswordDialog: () => setIsPasswordDialogOpen(true),
    closePasswordDialog,
    submitPassword,
    isDeleteAccountDialogOpen,
    openDeleteAccountDialog: () => setIsDeleteAccountDialogOpen(true),
    closeDeleteAccountDialog: () => setIsDeleteAccountDialogOpen(false),
    deleteAccount,
  };
}
