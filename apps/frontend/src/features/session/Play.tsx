'use client';

import {
  formatSessionCodeInput,
  type SessionLauncher,
  useSessionLauncher,
} from '@cityborn/client/session';
import { CITYBORN_CONTACT_EMAIL } from '@cityborn/core';
import { DialogContent, DialogTitle, Typography } from '@mui/material';
import Link from 'next/link';
import { Controller } from 'react-hook-form';
import Button from '@/components/ui/buttons/Button';
import LoadingButton from '@/components/ui/buttons/LoadingButton';
import { Dialog } from '@/components/ui/dialogs/Dialog';
import { useNavigation } from '@/lib/navigation';

export default function Play({
  openSignIn,
  openSignUp,
}: {
  openSignIn: () => void;
  openSignUp: () => void;
}) {
  const navigation = useNavigation();
  const {
    joinSessionForm: {
      control,
      formState: { errors },
    },
    playSolo,
    playMulti,
    joinSession,
    authenticationRequired,
    dismissAuthenticationRequired,
  }: SessionLauncher = useSessionLauncher({ navigation });

  return (
    <>
      <div className="flex flex-col gap-2 items-center justify-center w-full">
        <div className="flex flex-row gap-3 items-center w-full">
          <div className="flex-1 h-px bg-black rounded-full"></div>
          <Typography variant="h6">Jouer</Typography>
          <div className="flex-1 h-px bg-black rounded-full"></div>
        </div>
        <form onSubmit={joinSession} className="flex flex-col gap-1 w-full">
          <div className="flex flex-row gap-2 items-center justify-center w-full">
            <Controller
              control={control}
              name="code"
              render={({ field: { name, onChange, onBlur, ref, value } }) => (
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Code"
                  className="border border-gray-300 rounded px-4 py-2 w-full"
                  name={name}
                  ref={ref}
                  value={value}
                  onChange={(event) =>
                    onChange(formatSessionCodeInput(event.target.value))
                  }
                  onBlur={onBlur}
                />
              )}
            />
            <LoadingButton
              type="button"
              variant="contained"
              color="primary"
              className="text-white px-6 py-2 rounded"
              onClick={joinSession}
            >
              <p className="px-3">Rejoindre</p>
            </LoadingButton>
          </div>
          {errors.code && (
            <p className="text-red-500 text-sm text-center">
              {errors.code.message}
            </p>
          )}
        </form>
        <div className="flex flex-row gap-2 items-center justify-between w-full">
          <LoadingButton
            variant="contained"
            color="primary"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded w-full"
            onClick={playSolo}
          >
            <b>SOLO</b>
          </LoadingButton>
          <LoadingButton
            variant="contained"
            color="primary"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded w-full"
            onClick={playMulti}
          >
            <b>MULTI</b>
          </LoadingButton>
        </div>
        <footer className="flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
          <a
            href={`mailto:${CITYBORN_CONTACT_EMAIL}`}
            className="text-sm text-gray-600 hover:underline"
          >
            Nous contacter
          </a>
          <Link
            href="/terms-and-policies"
            className="text-sm text-gray-600 hover:underline text-center"
          >
            Politiques et conditions
          </Link>
        </footer>
      </div>

      <Dialog
        open={authenticationRequired}
        onClose={dismissAuthenticationRequired}
      >
        <DialogTitle sx={{ mt: 2, mx: 3, paddingX: 2, paddingTop: 2 }}>
          <p>Vous devez être connecté pour jouer en mode multi !</p>
        </DialogTitle>
        <DialogContent>
          <div className="flex flex-row gap-2 items-center justify-center w-full">
            <Button
              variant="contained"
              color="primary"
              className="bg-green-500 hover:bg-green-600 text-white px-6 w-full rounded"
              onClick={openSignIn}
            >
              <p className="px-3">Se connecter</p>
            </Button>
            <Button
              variant="contained"
              color="primary"
              className="bg-green-500 hover:bg-green-600 text-white px-6 w-full rounded"
              onClick={openSignUp}
            >
              <p className="px-3">S'inscrire</p>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
