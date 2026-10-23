'use client';

import {
  type PasswordResetFlow,
  usePasswordResetFlow,
} from '@cityborn/client/auth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Box, TextField, Typography } from '@mui/material';
import Link from 'next/link';
import { type ReadonlyURLSearchParams, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/buttons/Button';

export function ResetPasswordForm() {
  const searchParams: ReadonlyURLSearchParams = useSearchParams();
  const passwordResetToken: string = searchParams.get('token') ?? '';
  const {
    form: {
      register,
      formState: { errors, isSubmitting },
    },
    submit,
    isPasswordReset,
  }: PasswordResetFlow = usePasswordResetFlow({ passwordResetToken });

  if (isPasswordReset)
    return (
      <>
        <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
        <Typography variant="h5">Mot de passe modifié</Typography>
        <Typography variant="body2" color="text.secondary">
          Tu peux maintenant te connecter avec ton nouveau mot de passe. Tes
          autres appareils ont été déconnectés.
        </Typography>
        <Button variant="contained" LinkComponent={Link} href="/">
          Retour à l'accueil
        </Button>
      </>
    );

  return (
    <Box
      component="form"
      onSubmit={submit}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
    >
      <Typography variant="h5">Nouveau mot de passe</Typography>
      <TextField
        type="password"
        label="Nouveau mot de passe"
        {...register('newPassword')}
        error={!!errors.newPassword}
        helperText={errors.newPassword?.message}
      />
      <TextField
        type="password"
        label="Confirmer le nouveau mot de passe"
        {...register('confirmPassword')}
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword?.message}
      />
      <Button
        variant="contained"
        type="submit"
        loading={isSubmitting}
        disabled={!passwordResetToken}
      >
        Valider
      </Button>
      <Button variant="text" LinkComponent={Link} href="/forgot-password">
        Demander un nouveau lien
      </Button>
    </Box>
  );
}
