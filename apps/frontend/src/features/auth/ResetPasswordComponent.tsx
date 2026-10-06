'use client';

import {
  type ApiResult,
  ErrorCode,
  PasswordResetTokenSchema,
  resolveErrorMessage,
} from '@cityborn/api';
import { useError } from '@cityborn/client';
import { useResetPasswordForm } from '@cityborn/client/auth';
import { Box, CircularProgress, TextField, Typography } from '@mui/material';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/buttons/Button';
import {
  resetPassword,
  validatePasswordResetToken,
} from '@/server/use-server/auth';
import { RequestPasswordResetDialog } from './RequestPasswordResetDialog';

type TokenStatus =
  | 'loading'
  | 'valid'
  | 'invalid'
  | 'verification-error'
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
        setStatus('verification-error');
        invokeError(result.error);
      } catch (error) {
        setStatus('verification-error');
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%',
        maxWidth: 300,
      }}
    >
      <Typography variant="h5" component="h1" align="center">
        Réinitialiser son mot de passe
      </Typography>

      {status === 'loading' && (
        <Box
          role="status"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CircularProgress size={28} aria-label="Vérification du lien" />
          <Typography>Vérification de votre lien…</Typography>
        </Box>
      )}

      {status === 'valid' && (
        <Box
          component="form"
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          onSubmit={(event) => {
            if (isSubmitting) {
              event.preventDefault();
              return;
            }
            void onSubmit(event);
          }}
        >
          <TextField
            id="reset-password"
            fullWidth
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
            id="reset-password-confirmation"
            fullWidth
            type="password"
            label="Confirmer le mot de passe"
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
          <Typography role="alert" color="error" align="center">
            {resolveErrorMessage({
              code: ErrorCode.USER_PASSWORD_RESET_INVALID_TOKEN,
              message: '',
              statusCode: 401,
            })}
          </Typography>
          <RequestPasswordResetDialog />
        </>
      )}

      {status === 'verification-error' && (
        <Button variant="outlined" onClick={() => void validate(token)}>
          Réessayer la vérification
        </Button>
      )}

      {status === 'success' && (
        <>
          <Typography role="status" align="center">
            Votre mot de passe a bien été modifié.
          </Typography>
          <Typography variant="body2" align="center">
            Vous pouvez vous connecter avec votre nouveau mot de passe sur le
            site ou revenir dans l’application Cityborn sur votre mobile.
          </Typography>
          <Button component={Link} href="/sign-in" variant="contained">
            Retour à la connexion web
          </Button>
        </>
      )}

      {status !== 'success' && (
        <>
          <Button component={Link} href="/sign-in">
            Retour à la connexion
          </Button>
          <Typography variant="body2" color="text.secondary" align="center">
            Sur mobile, revenez dans l’application Cityborn après avoir modifié
            votre mot de passe.
          </Typography>
        </>
      )}
    </Box>
  );
}
