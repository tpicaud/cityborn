'use client';

import {
  type PasswordResetFlow,
  usePasswordResetFlow,
} from '@cityborn/client/auth';
import { Box, CircularProgress, TextField, Typography } from '@mui/material';
import Link from 'next/link';
import { type RefObject, useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/buttons/Button';
import { RequestPasswordResetDialog } from './RequestPasswordResetDialog';

type PasswordResetLink = {
  token: string;
  generation: number;
};

export function ResetPasswordForm() {
  const [link, setLink] = useState<PasswordResetLink | null>(null);
  const linkGeneration: RefObject<number> = useRef<number>(0);

  useEffect(() => {
    const readLink: () => void = () => {
      const token: string =
        new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '';
      const generation: number = ++linkGeneration.current;
      setLink({ token, generation });
    };
    readLink();
    window.addEventListener('hashchange', readLink);
    return () => {
      linkGeneration.current += 1;
      window.removeEventListener('hashchange', readLink);
    };
  }, []);

  if (!link) return <CircularProgress aria-label="Chargement du lien" />;

  return (
    <PasswordResetTokenForm
      key={link.generation}
      token={link.token}
      onPasswordReset={() => {
        const currentToken: string | null = new URLSearchParams(
          window.location.hash.slice(1),
        ).get('token');
        if (
          linkGeneration.current !== link.generation ||
          currentToken !== link.token
        )
          return;
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}`,
        );
      }}
    />
  );
}

function PasswordResetTokenForm({
  token,
  onPasswordReset,
}: {
  token: string;
  onPasswordReset: () => void;
}) {
  const {
    form: {
      register,
      formState: { errors, isSubmitting },
    },
    status,
    submit,
  }: PasswordResetFlow = usePasswordResetFlow({ token, onPasswordReset });

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

      {status === 'ready' && (
        <Box
          component="form"
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          onSubmit={submit}
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
            Le lien de réinitialisation est invalide, expiré ou déjà utilisé.
          </Typography>
          <RequestPasswordResetDialog />
        </>
      )}

      {status === 'success' && (
        <>
          <Typography role="status" align="center">
            Votre mot de passe a bien été modifié.
          </Typography>
          <Typography variant="body2" align="center">
            Vous pouvez vous connecter avec votre nouveau mot de passe depuis
            l’accueil du site ou dans l’application Cityborn sur votre mobile.
          </Typography>
          <Button component={Link} href="/" variant="contained">
            Retour à l’accueil
          </Button>
        </>
      )}

      {status !== 'success' && (
        <>
          <Button component={Link} href="/">
            Retour à l’accueil
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
