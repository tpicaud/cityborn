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
import {
  type ChangePasswordForm,
  type EmailForm,
  toUpdatePassword,
  type UsernameForm,
  useChangePasswordForm,
  useEmailForm,
  useUsernameForm,
} from './profileForms';

export type ProfileEditor = {
  usernameForm: UsernameForm;
  isUsernameUpdated: boolean;
  submitUsername: FormSubmitHandler;
  emailForm: EmailForm;
  isEmailUpdated: boolean;
  submitEmail: FormSubmitHandler;
  passwordForm: ChangePasswordForm;
  isPasswordUpdated: boolean;
  submitPassword: FormSubmitHandler;
};

export function useProfileEditor(): ProfileEditor {
  const { authApi, userApi }: DomainApis = useDomainApis();
  const { user }: CurrentUser = useCurrentUser();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const usernameForm: UsernameForm = useUsernameForm(user?.username ?? '');
  const emailForm: EmailForm = useEmailForm(user?.email ?? '');
  const passwordForm: ChangePasswordForm = useChangePasswordForm();
  const [isUsernameUpdated, setIsUsernameUpdated] = useState<boolean>(false);
  const [isEmailUpdated, setIsEmailUpdated] = useState<boolean>(false);
  const [isPasswordUpdated, setIsPasswordUpdated] = useState<boolean>(false);

  const submitUsername: FormSubmitHandler = usernameForm.handleSubmit(
    async (data) => {
      setIsUsernameUpdated(false);
      try {
        const updatedUser: User = await userApi.updateUsername(data);
        await setCurrentUser({ queryClient, user: updatedUser });
        usernameForm.reset({ username: updatedUser.username });
        setIsUsernameUpdated(true);
      } catch (error: unknown) {
        reportError(error);
      }
    },
  );

  const submitEmail: FormSubmitHandler = emailForm.handleSubmit(
    async (data) => {
      setIsEmailUpdated(false);
      try {
        const updatedUser: User = await authApi.updateEmail(data);
        await setCurrentUser({ queryClient, user: updatedUser });
        emailForm.reset({ email: updatedUser.email });
        setIsEmailUpdated(true);
      } catch (error: unknown) {
        reportError(error);
      }
    },
  );

  const submitPassword: FormSubmitHandler = passwordForm.handleSubmit(
    async (values) => {
      setIsPasswordUpdated(false);
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

  return {
    usernameForm,
    isUsernameUpdated,
    submitUsername,
    emailForm,
    isEmailUpdated,
    submitEmail,
    passwordForm,
    isPasswordUpdated,
    submitPassword,
  };
}
