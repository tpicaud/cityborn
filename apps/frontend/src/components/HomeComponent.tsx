'use client';

import { isApiError } from '@cityborn/api';
import { useError } from '@cityborn/client';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import { Box, Dialog, DialogContent, DialogTitle } from '@mui/material';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/server/actions/auth';
import { SignInComponent } from './auth/SignInComponent';
import { SignUpComponent } from './auth/SignUpComponent';
import MenuComponent from './menu/MenuComponent';
import { ProfileComponent } from './menu/ProfileComponent';
import IconButton from './ui/buttons/IconButton';
import LoadingIconButton from './ui/buttons/LoadingIconButton';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false },
);

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize: (config: {
        client_id?: string;
        callback: (response: { credential: string }) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement | null,
        options: { theme?: string; size?: string; text?: string },
      ) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

export default function HomeComponent() {
  const { user, refreshUser } = useAuth();
  const { invokeError } = useError();
  const [state, setState] = useState<
    'menu' | 'sign-in' | 'sign-up' | 'profile'
  >('menu');
  const [openProfile, setOpenProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setState('menu');
    }
  }, [user]);

  let content: ReactNode;

  switch (state) {
    case 'sign-in':
      content = <SignInComponent />;
      break;

    case 'sign-up':
      content = <SignUpComponent />;
      break;

    case 'menu':
      content = <MenuComponent setState={setState} />;
      break;

    case 'profile':
      content = user ? (
        <ProfileComponent user={user} />
      ) : (
        <MenuComponent setState={setState} />
      );
      break;

    default:
      content = <MenuComponent setState={setState} />;
  }

  return (
    <div className="relative h-screen">
      <div className="absolute inset-0">
        <MapContainer
          center={[0, 0]}
          zoom={3}
          zoomControl={false}
          className="h-full w-full z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </MapContainer>
        <div className="absolute inset-0 bg-black opacity-60 z-10 pointer-events-none"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 bg-transparent pointer-events-none">
        <Box className="relative flex flex-col p-6 bg-slate-100 shadow-xl rounded-2xl max-w-[85%] pointer-events-auto">
          <div className="absolute self-center top-2 flex flex-col h-[15%] w-[95%]">
            <div className="flex flex-row items-start justify-between w-full">
              <IconButton
                onClick={() => setState('menu')}
                sx={{
                  visibility: state === 'menu' ? 'hidden' : 'visible',
                }}
                className="z-10"
              >
                <ArrowBackIcon />
              </IconButton>

              <div className="flex flex-row justify-end">
                <IconButton
                  onClick={async () => {
                    setState('profile');
                  }}
                  sx={{
                    visibility: user && state === 'menu' ? 'visible' : 'hidden',
                  }}
                  className="z-10"
                >
                  <AccountCircleIcon />
                </IconButton>
                <LoadingIconButton
                  onClick={async () => {
                    try {
                      await signOut();
                      await refreshUser();
                      setState('menu');
                    } catch (error: unknown) {
                      invokeError(
                        isApiError(error) ? error : 'Une erreur est survenue',
                      );
                    }
                  }}
                  sx={{
                    visibility: user ? 'visible' : 'hidden',
                  }}
                  className="z-10"
                >
                  <LogoutIcon />
                </LoadingIconButton>
              </div>
            </div>
          </div>
          {content}
        </Box>
      </div>

      <Dialog open={openProfile} onClose={() => setOpenProfile(false)}>
        <IconButton
          aria-label="close"
          onClick={() => setOpenProfile(false)}
          sx={{
            position: 'absolute',
            right: 0,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogTitle className="text-center">
          <p>Profile</p>
        </DialogTitle>
        <DialogContent>
          <div className="grid grid-cols-1 md:grid-cols-2 justify-items-start gap-4 w-full">
            <div className="flex flex-col justify-items-start gap-0 w-full">
              <p className="font-bold">Nom d'utilisateur</p>
              <p>{user?.username}</p>
            </div>
            <div className="flex flex-col justify-items-start gap-0 w-full">
              <p className="font-bold">Email</p>
              <div>{user?.email}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
