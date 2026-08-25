'use client';

import { type SignIn, SignInSchema } from '@cityborn/api';
import { toAppError, useError } from '@cityborn/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, FormControl, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { signIn, signInWithGoogle } from '@/server/use-server/auth';
import Button from '../ui/buttons/Button';

const SIGN_IN_FORM_FIELDS = [
  'identifier',
  'password',
] as const satisfies readonly (keyof SignIn)[];

function isSignInFormField(
  path: string,
): path is (typeof SIGN_IN_FORM_FIELDS)[number] {
  return (SIGN_IN_FORM_FIELDS as readonly string[]).includes(path);
}

export const SignInComponent = () => {
  const { invokeError } = useError();
  const [isGoogleSignInFormSubmitting, setIsGoogleSignInFormSubmitting] =
    useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignIn>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { identifier: '', password: '' },
  });

  useEffect(() => {
    const handleCredentialResponse = async (response: {
      credential: string;
    }) => {
      try {
        setIsGoogleSignInFormSubmitting(true);
        const result = await signInWithGoogle({ idToken: response.credential });
        if (!result.ok) return invokeError(toAppError(result.error));
        window.location.reload();
      } finally {
        setIsGoogleSignInFormSubmitting(false);
      }
    };

    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('googleSignInDiv'),
        { theme: 'outline', size: 'large', text: 'signin_with' },
      );
    }
  }, [invokeError]);

  const onSubmit = handleSubmit(async (values) => {
    const result = await signIn(values);

    if (result.ok) {
      window.location.reload();
      return;
    }

    const fieldErrors = result.error.fieldErrors;
    if (!fieldErrors || fieldErrors.length === 0) {
      invokeError(toAppError(result.error));
      return;
    }

    for (const fieldError of fieldErrors) {
      if (isSignInFormField(fieldError.path)) {
        setError(fieldError.path, { message: fieldError.message });
        continue;
      }
      invokeError(fieldError.message);
    }
  });

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 300 }}
    >
      <Typography variant="h5" align="center">
        Connexion
      </Typography>

      <FormControl>
        <TextField
          label="Username"
          {...register('identifier')}
          error={!!errors.identifier}
          helperText={errors.identifier?.message}
        />
      </FormControl>

      <FormControl>
        <TextField
          type="password"
          label="Password"
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
        />
      </FormControl>

      <Button variant="contained" type="submit" loading={isSubmitting}>
        Se connecter
      </Button>

      <div className="flex flex-row gap-3 items-center w-full">
        <div className="flex-1 h-px bg-black rounded-full"></div>
        <Typography>OU</Typography>
        <div className="flex-1 h-px bg-black rounded-full"></div>
      </div>

      <div className="relative flex justify-center items-center h-[44px] w-full">
        <div id="googleSignInDiv"></div>
        {isGoogleSignInFormSubmitting && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded">
            <svg
              aria-label="Chargement"
              className="animate-spin h-5 w-5 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </div>
        )}
      </div>
    </Box>
  );
};
