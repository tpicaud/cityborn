'use client';

import type { IdentityProviderSignIn } from '@cityborn/client/auth';
import { Button, TextField } from '@mui/material';
import { type FormEvent, useState } from 'react';

export function GoogleEmailVerification({
  flow,
}: {
  flow: IdentityProviderSignIn;
}) {
  const [code, setCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const confirm = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await flow.confirmGoogleEmail(code);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={confirm} className="flex flex-col gap-3 p-4">
      <p>
        Confirmez votre connexion Google avec le code à 8 chiffres envoyé à
        votre adresse e-mail. L’association conserve votre progression et vos
        connexions existantes.
      </p>
      <TextField
        label="Code de confirmation Google"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        autoComplete="one-time-code"
        slotProps={{
          htmlInput: {
            inputMode: 'numeric',
            pattern: '[0-9]{8}',
            maxLength: 8,
          },
        }}
        required
        disabled={isSubmitting}
      />
      <Button
        variant="contained"
        type="submit"
        disabled={isSubmitting || code.length !== 8}
      >
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
