'use client';

import type { ApiResult, PasswordResetRequestResponse } from '@cityborn/api';

import { useError } from '@cityborn/client';
import { useRequestPasswordResetForm } from '@cityborn/client/auth';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { requestPasswordReset } from '@/server/use-server/auth';

export function RequestPasswordResetDialog() {
  const [open, setOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const { invokeError } = useError();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useRequestPasswordResetForm();
  const onSubmit = handleSubmit(async (values) => {
    try {
      const result: ApiResult<PasswordResetRequestResponse> =
        await requestPasswordReset(values);
      if (!result.ok) return invokeError(result.error);
      setMessage(result.data.message);
    } catch (error) {
      invokeError(error);
    }
  });

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setMessage(null);
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
            if (isSubmitting) {
              event.preventDefault();
              return;
            }
            void onSubmit(event);
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
