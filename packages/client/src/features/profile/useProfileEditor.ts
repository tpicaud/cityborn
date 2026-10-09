'use client';

import type { User } from '@cityborn/api';
import { useState } from 'react';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import { useError } from '../../shared/errorContext';
import { useAuth } from '../auth/authContext';
import {
  type ChangePasswordForm,
  type ProfileFormSubmitHandler,
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
  submitUsername: ProfileFormSubmitHandler;
  passwordForm: ChangePasswordForm;
  isPasswordDialogOpen: boolean;
  isPasswordUpdated: boolean;
  openPasswordDialog: () => void;
  closePasswordDialog: () => void;
  submitPassword: ProfileFormSubmitHandler;
  isDeleteAccountDialogOpen: boolean;
  openDeleteAccountDialog: () => void;
  closeDeleteAccountDialog: () => void;
  deleteAccount: () => Promise<void>;
};

export function useProfileEditor({
  onAccountDeleted,
}: ProfileEditorOptions = {}): ProfileEditor {
  const { authApi, profileApi }: DomainApis = useDomainApis();
  const { user, setUser } = useAuth();
  const { invokeError } = useError();
  const usernameForm: UsernameForm = useUsernameForm(user?.username ?? '');
  const passwordForm: ChangePasswordForm = useChangePasswordForm();
  const [isEditingUsername, setIsEditingUsername] = useState<boolean>(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] =
    useState<boolean>(false);
  const [isPasswordUpdated, setIsPasswordUpdated] = useState<boolean>(false);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] =
    useState<boolean>(false);

  const submitUsername: ProfileFormSubmitHandler = usernameForm.handleSubmit(
    async (data) => {
      try {
        const updatedUser: User = await profileApi.updateUsername(data);
        setUser(updatedUser);
        usernameForm.reset({ username: updatedUser.username });
        setIsEditingUsername(false);
      } catch (error: unknown) {
        invokeError(error);
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

  const submitPassword: ProfileFormSubmitHandler = passwordForm.handleSubmit(
    async (values) => {
      try {
        const updatedUser: User = await authApi.updatePassword(
          toUpdatePassword(values),
        );
        setUser(updatedUser);
        passwordForm.reset();
        setIsPasswordUpdated(true);
      } catch (error: unknown) {
        invokeError(error);
      }
    },
  );

  const deleteAccount = async (): Promise<void> => {
    try {
      await authApi.deleteUser();
      await authApi.signOut();
      setUser(null);
      setIsDeleteAccountDialogOpen(false);
      onAccountDeleted?.();
    } catch (error: unknown) {
      invokeError(error);
    }
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
