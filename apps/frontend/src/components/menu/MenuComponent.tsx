'use client';

import { DialogContent, DialogTitle, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import 'leaflet/dist/leaflet.css';
import { type Session, SessionMode } from '@cityborn/api';
import { resolveCaughtError, useError } from '@cityborn/client';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import Link from 'next/link';
import { type Dispatch, type SetStateAction, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { resendVerificationEmail } from '@/server/use-server/auth';
import { createSession, fetchSession } from '@/server/use-server/session';
import Button from '../ui/buttons/Button';
import LoadingButton from '../ui/buttons/LoadingButton';
import { Dialog } from '../ui/dialogs/Dialog';

const JoinSessionSchema = z.object({
  code: z.string().min(1, 'Veuillez entrer un code'),
});

type JoinSessionFormValues = z.infer<typeof JoinSessionSchema>;

const JOIN_SESSION_FORM_FIELDS = [
  'code',
] as const satisfies readonly (keyof JoinSessionFormValues)[];

function isJoinSessionFormField(
  path: string,
): path is (typeof JOIN_SESSION_FORM_FIELDS)[number] {
  return (JOIN_SESSION_FORM_FIELDS as readonly string[]).includes(path);
}

export default function MenuComponent({
  setState,
}: {
  setState: Dispatch<
    SetStateAction<'menu' | 'sign-in' | 'sign-up' | 'profile'>
  >;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { invokeError } = useError();
  const [openConnectionAlert, setOpenConnectionAlert] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<JoinSessionFormValues>({
    resolver: zodResolver(JoinSessionSchema),
    defaultValues: { code: '' },
  });

  const handleSoloPlay = () => {
    router.push(`/session/solo`);
  };

  const handleMultiPlay = async () => {
    if (!user) {
      setOpenConnectionAlert(true);
    } else {
      const result = await createSession({ mode: SessionMode.MULTI });
      if (!result.ok) return invokeError(result.error);
      const session: Session = result.data;
      router.push(`/session/multi/${session.id}`);
    }
  };

  const handleJoin = handleSubmit(async (values) => {
    const result = await fetchSession(values.code);
    if (result.ok) {
      router.push(`/session/multi/${values.code}`);
      return;
    }

    const fieldErrors = result.error.fieldErrors;
    if (!fieldErrors || fieldErrors.length === 0) {
      invokeError(result.error);
      return;
    }

    for (const fieldError of fieldErrors) {
      if (isJoinSessionFormField(fieldError.path)) {
        setError(fieldError.path, { message: fieldError.message });
        continue;
      }
      invokeError(fieldError.message);
    }
  });

  const handleResendVerificationEmail = async () => {
    try {
      await resendVerificationEmail();
      setVerificationEmailSent(true);
    } catch (error) {
      invokeError(resolveCaughtError(error, 'Une erreur est survenue'));
    }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative flex flex-col gap-1 items-center w-full">
        <Image
          src="/logo.png"
          alt="Logo"
          width={200}
          height={200}
          style={{ objectFit: 'contain' }}
          className="object-contain w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-2xl"
          priority
        />
        <p className="text-base md:text-lg text-center ">
          Trouve le lieu de naissance des personnalités
        </p>
      </div>

      {user ? (
        <div className="flex flex-col items-center justify-center gap-2 w-full">
          <Typography variant="h5" className="text-center">
            Bienvenue <b>{user.username}</b> !
          </Typography>
          {user.isVerified === false && (
            <div className="flex flex-col items-center gap-2 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-center w-full max-w-xs">
              <p className="text-sm font-medium text-amber-900">
                Votre adresse e-mail n'est pas vérifiée
              </p>
              <LoadingButton
                variant="text"
                color="warning"
                size="small"
                className="normal-case underline"
                onClick={handleResendVerificationEmail}
                disabled={verificationEmailSent}
              >
                {verificationEmailSent
                  ? 'E-mail de vérification envoyé'
                  : 'Renvoyer un e-mail de vérification'}
              </LoadingButton>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-row gap-2 items-center justify-center w-full">
          <Button
            variant="contained"
            color="primary"
            className="text-white px-6 w-full rounded"
            onClick={async () => {
              setState('sign-in');
            }}
          >
            <p className="px-3">Connexion</p>
          </Button>
          <Button
            variant="contained"
            color="primary"
            className="text-white px-6 w-full rounded"
            onClick={async () => {
              setState('sign-up');
            }}
          >
            <p className="px-3">Inscription</p>
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-2 items-center justify-center w-full">
        <div className="flex flex-row gap-3 items-center w-full">
          <div className="flex-1 h-px bg-black rounded-full"></div>
          <Typography variant="h6">Jouer</Typography>
          <div className="flex-1 h-px bg-black rounded-full"></div>
        </div>
        <form onSubmit={handleJoin} className="flex flex-col gap-1 w-full">
          <div className="flex flex-row gap-2 items-center justify-center w-full">
            <input
              type="text"
              placeholder="Code"
              className="border border-gray-300 rounded px-4 py-2 w-full"
              {...register('code')}
            />
            <LoadingButton
              type="button"
              variant="contained"
              color="primary"
              className="text-white px-6 py-2 rounded"
              onClick={handleJoin}
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
            onClick={handleSoloPlay}
          >
            <b>SOLO</b>
          </LoadingButton>
          <LoadingButton
            variant="contained"
            color="primary"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded w-full"
            onClick={handleMultiPlay}
          >
            <b>MULTI</b>
          </LoadingButton>
        </div>
        <p className="w-full text-center">
          <Link
            href="/terms-and-policies"
            className="text-sm text-gray-600 hover:underline text-center"
          >
            Politique de confidentialité
          </Link>
        </p>{' '}
      </div>

      <Dialog
        open={openConnectionAlert}
        onClose={() => setOpenConnectionAlert(false)}
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
              onClick={async () => {
                setState('sign-in');
              }}
            >
              <p className="px-3">Se connecter</p>
            </Button>
            <Button
              variant="contained"
              color="primary"
              className="bg-green-500 hover:bg-green-600 text-white px-6 w-full rounded"
              onClick={async () => {
                setState('sign-up');
              }}
            >
              <p className="px-3">S'inscrire</p>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
