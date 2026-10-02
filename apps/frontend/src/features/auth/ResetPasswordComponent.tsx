'use client';

import {
  type ApiResult,
  ErrorCode,
  PasswordResetTokenSchema,
  resolveErrorMessage,
} from '@cityborn/api';
import { useError } from '@cityborn/client';
import { useResetPasswordForm } from '@cityborn/client/auth';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import type { SxProps, Theme } from '@mui/material';
import { Box, Button, CircularProgress, TextField } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  resetPassword,
  validatePasswordResetToken,
} from '@/server/use-server/auth';
import { RequestPasswordResetDialog } from './RequestPasswordResetDialog';
import styles from './ResetPasswordComponent.module.css';

type TokenStatus =
  | 'loading'
  | 'valid'
  | 'invalid'
  | 'network-error'
  | 'success';

const passwordFieldStyles: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    fontFamily: 'inherit',
  },
  '& .MuiInputBase-input': { minWidth: 0, fontSize: '1rem' },
  '& .MuiInputLabel-root, & .MuiFormHelperText-root': {
    fontFamily: 'inherit',
  },
  '& .MuiFormHelperText-root': { marginInline: 0, lineHeight: 1.6 },
  '& .MuiInputLabel-root.Mui-focused:not(.Mui-error)': {
    color: 'var(--color-primary-700)',
  },
  '& .MuiOutlinedInput-root.Mui-focused:not(.Mui-error) .MuiOutlinedInput-notchedOutline':
    { borderColor: 'var(--color-primary-600)' },
};

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
    <div className={styles.page}>
      <section className={styles.panel} aria-labelledby="reset-password-title">
        <div className={styles.brandPanel}>
          <Link href="/" className={styles.logoLink}>
            <Image
              src="/logo_white.webp"
              alt="Cityborn — accueil"
              width={160}
              height={160}
              className={styles.logo}
              sizes="(min-width: 900px) 160px, 88px"
            />
          </Link>
          <div className={styles.brandCopy}>
            <p className={styles.brandHeading}>Le monde vous attend.</p>
            <p className={styles.brandDescription}>
              Retrouvez votre compte et repartez à la découverte du lieu de
              naissance des personnalités.
            </p>
          </div>
        </div>

        <div className={styles.formPanel}>
          <header className={styles.formHeader}>
            <p className={styles.eyebrow}>Votre compte Cityborn</p>
            <h1 id="reset-password-title" className={styles.title}>
              {status === 'success'
                ? 'Votre prochaine partie vous attend !'
                : 'Réinitialisez votre mot de passe'}
            </h1>
            {status === 'valid' && (
              <p className={styles.description}>
                Choisissez un nouveau mot de passe pour retrouver votre compte.
              </p>
            )}
          </header>

          {status === 'loading' && (
            <div className={styles.loading} role="status">
              <CircularProgress
                className={styles.loadingIndicator}
                size={28}
                color="inherit"
                aria-label="Vérification du lien"
              />
              <p>Vérification de votre lien…</p>
            </div>
          )}

          {status === 'valid' && (
            <Box
              component="form"
              className={styles.form}
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
                sx={passwordFieldStyles}
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
                sx={passwordFieldStyles}
                fullWidth
                type="password"
                label="Confirmer le mot de passe"
                autoComplete="new-password"
                {...register('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
              />
              <Button
                className={styles.primaryButton}
                fullWidth
                disableElevation
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
            <div className={styles.feedback}>
              <p role="alert" className={styles.invalidMessage}>
                {resolveErrorMessage({
                  code: ErrorCode.USER_PASSWORD_RESET_INVALID_TOKEN,
                  message: '',
                  statusCode: 401,
                })}
              </p>
              <div className={styles.recoveryAction}>
                <RequestPasswordResetDialog />
              </div>
            </div>
          )}

          {status === 'network-error' && (
            <Button
              className={styles.retryButton}
              variant="outlined"
              fullWidth
              onClick={() => void validate(token)}
            >
              Réessayer la vérification
            </Button>
          )}

          {status === 'success' && (
            <div className={styles.feedback}>
              <div role="status" className={styles.successMessage}>
                <CheckCircleOutlineRoundedIcon
                  fontSize="large"
                  aria-hidden="true"
                />
                <p>Votre mot de passe a bien été modifié.</p>
              </div>
              <p className={styles.description}>
                Vous pouvez vous connecter avec votre nouveau mot de passe sur
                le site ou revenir dans l’application Cityborn sur votre mobile.
              </p>
              <Button
                className={styles.primaryButton}
                component={Link}
                href="/sign-in"
                variant="contained"
                fullWidth
                disableElevation
              >
                Retour à la connexion web
              </Button>
            </div>
          )}

          {status !== 'success' && (
            <footer className={styles.footer}>
              <Link href="/sign-in" className={styles.backLink}>
                <ArrowBackRoundedIcon fontSize="small" aria-hidden="true" />
                Retour à la connexion
              </Link>
              <p>
                Sur mobile, revenez dans l’application Cityborn après avoir
                modifié votre mot de passe.
              </p>
            </footer>
          )}
        </div>
      </section>
    </div>
  );
}
