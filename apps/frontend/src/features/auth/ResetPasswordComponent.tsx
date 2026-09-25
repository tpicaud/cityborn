'use client';

import {
  type ApiResult,
  ErrorCode,
  PasswordResetTokenSchema,
  resolveErrorMessage,
} from '@cityborn/api';
import { useError } from '@cityborn/client';
import { useResetPasswordForm } from '@cityborn/client/auth';
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  resetPassword,
  validatePasswordResetToken,
} from '@/server/use-server/auth';
import { RequestPasswordResetDialog } from './RequestPasswordResetDialog';

type TokenStatus =
  | 'loading'
  | 'valid'
  | 'invalid'
  | 'network-error'
  | 'success';

export function ResetPasswordComponent() {
  const hasStartedValidation = useRef<boolean>(false);
  const [token, setToken] = useState<string>('');
  const [status, setStatus] = useState<TokenStatus>('loading');
  const { invokeError } = useError();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useResetPasswordForm(token);
  const validate = useCallback(
    async (value: string) => {
      if (!PasswordResetTokenSchema.safeParse({ token: value }).success) {
        setStatus('invalid');
        return;
      }
      setStatus('loading');
      try {
        const result: ApiResult<void> = await validatePasswordResetToken({
          token: value,
        });
        if (result.ok) {
          setStatus('valid');
          return;
        }
        if (result.error.code === ErrorCode.USER_PASSWORD_RESET_INVALID_TOKEN) {
          setStatus('invalid');
          return;
        }
        setStatus('network-error');
        invokeError(result.error);
      } catch (error) {
        setStatus('network-error');
        invokeError(error);
      }
    },
    [invokeError],
  );

  useEffect(() => {
    if (hasStartedValidation.current) return;
    hasStartedValidation.current = true;
    const value: string =
      new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '';
    setToken(value);
    void validate(value);
  }, [validate]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result: ApiResult<void> = await resetPassword(values);
      if (result.ok) {
        window.history.replaceState(null, '', window.location.pathname);
        setStatus('success');
        return;
      }
      if (result.error.code === ErrorCode.USER_PASSWORD_RESET_INVALID_TOKEN) {
        setStatus('invalid');
        return;
      }
      invokeError(result.error);
    } catch (error) {
      invokeError(error);
    }
  });

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <Box
        sx={{
          width: '100%',
          maxWidth: 440,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Typography variant="h5" component="h1">
          Réinitialiser son mot de passe
        </Typography>
        {status === 'loading' && (
          <CircularProgress aria-label="Vérification du lien" />
        )}
        {status === 'valid' && (
          <Box
            component="form"
            onSubmit={(event) => {
              if (isSubmitting) {
                event.preventDefault();
                return;
              }
              void onSubmit(event);
            }}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              type="password"
              label="Nouveau mot de passe"
              autoComplete="new-password"
              {...register('password')}
              error={!!errors.password}
              helperText={
                errors.password?.message ??
                '6 à 32 caractères, au moins une majuscule et un chiffre.'
              }
            />
            <TextField
              type="password"
              label="Confirmer votre nouveau mot de passe"
              autoComplete="new-password"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />
            <Button
              variant="contained"
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Modifier mon mot de passe
            </Button>
          </Box>
        )}
        {status === 'invalid' && (
          <>
            <Typography role="alert">
              {resolveErrorMessage({
                code: ErrorCode.USER_PASSWORD_RESET_INVALID_TOKEN,
                message: '',
                statusCode: 401,
              })}
            </Typography>
            <RequestPasswordResetDialog />
          </>
        )}
        {status === 'network-error' && (
          <Button onClick={() => void validate(token)}>Réessayer</Button>
        )}
        {status === 'success' && (
          <>
            <Typography role="status">
              Votre mot de passe a bien été modifié
            </Typography>
            <Typography>
              Vous pouvez également vous reconnecter dans l’application mobile.
            </Typography>
            <Button component={Link} href="/sign-in" variant="contained">
              Retour à la connexion web
            </Button>
          </>
        )}
      </Box>
    </main>
  );
}
