'use client';

import type { User } from '@cityborn/api';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import { setCurrentUser } from '../../domains/auth/authQueries';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../shared/errorReporter';
import type { FormSubmitHandler } from '../../shared/formSubmitHandler';
import { type CurrentUser, useCurrentUser } from '../auth/authContext';
import { type SignOut, useSignOut } from '../auth/useSignOut';
import {
  type ChangePasswordForm,
  type EmailForm,
  toUpdatePassword,
  type UsernameForm,
  useChangePasswordForm,
  useEmailForm,
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
  emailForm: EmailForm;
  isEditingEmail: boolean;
  isEmailUpdated: boolean;
  startEmailEdit: () => void;
  cancelEmailEdit: () => void;
  submitEmail: FormSubmitHandler;
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
  const { authApi, userApi }: DomainApis = useDomainApis();
  const { user }: CurrentUser = useCurrentUser();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const usernameForm: UsernameForm = useUsernameForm(user?.username ?? '');
  const emailForm: EmailForm = useEmailForm(user?.email ?? '');
  const passwordForm: ChangePasswordForm = useChangePasswordForm();
  const [isEditingUsername, setIsEditingUsername] = useState<boolean>(false);
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(false);
  const [isEmailUpdated, setIsEmailUpdated] = useState<boolean>(false);
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
        const updatedUser: User = await userApi.updateUsername(data);
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

  const submitEmail: FormSubmitHandler = emailForm.handleSubmit(
    async (data) => {
      try {
        const updatedUser: User = await authApi.updateEmail(data);
        await setCurrentUser({ queryClient, user: updatedUser });
        emailForm.reset({ email: updatedUser.email });
        setIsEditingEmail(false);
        setIsEmailUpdated(true);
      } catch (error: unknown) {
        reportError(error);
      }
    },
  );

  const cancelEmailEdit = (): void => {
    emailForm.reset({ email: user?.email ?? '' });
    setIsEditingEmail(false);
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
    emailForm,
    isEditingEmail,
    isEmailUpdated,
    startEmailEdit: () => {
      setIsEmailUpdated(false);
      setIsEditingEmail(true);
    },
    cancelEmailEdit,
    submitEmail,
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
