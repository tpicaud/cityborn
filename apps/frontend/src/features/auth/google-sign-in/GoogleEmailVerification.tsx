'use client';

import type { IdentityProviderSignIn } from '@cityborn/client/auth';
import { Button, TextField } from '@mui/material';

export function GoogleEmailVerification({
  flow,
}: {
  flow: IdentityProviderSignIn;
}) {
  const {
    googleEmailVerificationForm: {
      register,
      formState: { errors, isSubmitting },
    },
  }: IdentityProviderSignIn = flow;

  return (
    <form
      onSubmit={flow.confirmGoogleEmail}
      noValidate
      className="flex flex-col gap-3 p-4"
    >
      <p>
        Confirmez votre connexion Google avec le code à 8 chiffres envoyé à
        votre adresse e-mail. L’association conserve votre progression et vos
        connexions existantes.
      </p>
      <TextField
        label="Code de confirmation Google"
        {...register('emailVerificationCode')}
        error={!!errors.emailVerificationCode}
        helperText={errors.emailVerificationCode?.message}
        autoComplete="one-time-code"
        slotProps={{
          htmlInput: {
            inputMode: 'numeric',
            maxLength: 8,
          },
        }}
        required
        disabled={isSubmitting}
      />
      <Button variant="contained" type="submit" disabled={isSubmitting}>
        Confirmer et associer Google
      </Button>
      <Button
        type="button"
        disabled={isSubmitting}
        onClick={flow.resendGoogleEmailVerification}
      >
        Renvoyer le code (après 3 minutes)
      </Button>
      <Button
        type="button"
        disabled={isSubmitting}
        onClick={flow.cancelGoogleEmailVerification}
      >
        Annuler
      </Button>
    </form>
  );
}
