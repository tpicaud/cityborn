'use client';

import {
  type PasswordResetRequestFlow,
  usePasswordResetRequestFlow,
} from '@cityborn/client/auth';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import Button from '@/components/ui/buttons/Button';

export function RequestPasswordResetDialog() {
  const [open, setOpen] = useState<boolean>(false);
  const {
    form: {
      register,
      formState: { errors, isSubmitting },
    },
    message,
    reset,
    submit,
  }: PasswordResetRequestFlow = usePasswordResetRequestFlow();

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        Mot de passe oublié ?
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          if (!isSubmitting) setOpen(false);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Réinitialiser son mot de passe</DialogTitle>
        <form
          onSubmit={(event) => {
            event.stopPropagation();
            void submit(event);
          }}
        >
          <DialogContent>
            {message ? (
              <Typography role="status">{message}</Typography>
            ) : (
              <TextField
                autoFocus
                fullWidth
                type="email"
                label="Adresse e-mail"
                autoComplete="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          </DialogContent>
          <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => setOpen(false)}
            >
              Fermer
            </Button>
            {!message && (
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Envoyer le lien de réinitialisation
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
