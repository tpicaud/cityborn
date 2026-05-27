'use client';

import { DialogContent, DialogTitle, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import 'leaflet/dist/leaflet.css';
import { type Session, SessionMode } from '@cityborn/api';
import Image from 'next/image';
import Link from 'next/link';
import { type Dispatch, type SetStateAction, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useError } from '@/contexts/ErrorContext';
import { createSession, fetchSession } from '@/server/actions/session';
import Button from '../ui/buttons/Button';
import LoadingButton from '../ui/buttons/LoadingButton';
import { Dialog } from '../ui/dialogs/Dialog';

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
  const [code, setCode] = useState<string>('');
  const [openConnectionAlert, setOpenConnectionAlert] = useState(false);

  const handleSoloPlay = () => {
    router.push(`/session/solo`);
  };

  const handleMultiPlay = async () => {
    if (!user) {
      setOpenConnectionAlert(true);
    } else {
      const result = await createSession(SessionMode.MULTI);
      if (!result.ok) return invokeError(result.error);
      const session: Session = result.data;
      router.push(`/session/multi/${session.id}`);
    }
  };

  const handleJoin = async () => {
    const result = await fetchSession(code);
    if (!result.ok) return invokeError(result.error);
    router.push(`/session/multi/${code}`);
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
        <div className="flex flex-col items-center justify-center">
          <Typography variant="h5" className="text-center">
            Bienvenue <b>{user.username}</b> !
          </Typography>
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
        <div className="flex flex-row gap-2 items-center justify-center w-full">
          <input
            type="text"
            placeholder="Code"
            className="border border-gray-300 rounded px-4 py-2 w-full"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <LoadingButton
            variant="contained"
            color="primary"
            className="text-white px-6 py-2 rounded"
            onClick={handleJoin}
            disabled={!code}
          >
            <p className="px-3">Rejoindre</p>
          </LoadingButton>
        </div>
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
