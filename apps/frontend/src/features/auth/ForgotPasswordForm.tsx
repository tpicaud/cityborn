'use client';

import {
  type PasswordResetRequestFlow,
  usePasswordResetRequestFlow,
} from '@cityborn/client/auth';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import { Box, TextField, Typography } from '@mui/material';
import Link from 'next/link';
import Button from '@/components/ui/buttons/Button';

export function ForgotPasswordForm() {
  const {
    form: {
      register,
      formState: { errors, isSubmitting },
    },
    submit,
    requestedEmail,
  }: PasswordResetRequestFlow = usePasswordResetRequestFlow();

  if (requestedEmail)
    return (
      <>
        <MarkEmailReadIcon color="primary" sx={{ fontSize: 40 }} />
        <Typography variant="h5">Vérifie tes e-mails</Typography>
        <Typography variant="body2" color="text.secondary">
          Si un compte Cityborn est associé à <b>{requestedEmail}</b>, un lien
          pour choisir un nouveau mot de passe vient d'y être envoyé.
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
      <Typography variant="h5">Mot de passe oublié</Typography>
      <Typography variant="body2" color="text.secondary">
        Saisis l'adresse e-mail de ton compte pour recevoir un lien de
        réinitialisation.
      </Typography>
      <TextField
        type="email"
        label="Email"
        {...register('email')}
        error={!!errors.email}
        helperText={errors.email?.message}
      />
      <Button variant="contained" type="submit" loading={isSubmitting}>
        Envoyer le lien
      </Button>
      <Button variant="text" LinkComponent={Link} href="/">
        Retour à l'accueil
      </Button>
    </Box>
  );
}
