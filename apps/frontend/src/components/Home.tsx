'use client';

import { useError } from '@cityborn/client';
import { useAuth } from '@cityborn/client/auth';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';
import { Box } from '@mui/material';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { authApi } from '@/lib/api/auth';
import { SignInForm } from './auth/SignInForm';
import { SignUpForm } from './auth/SignUpForm';
import Menu from './menu/Menu';
import { Profile } from './menu/Profile';
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

export default function Home() {
  const { user, setUser } = useAuth();
  const { invokeError } = useError();
  const [state, setState] = useState<
    'menu' | 'sign-in' | 'sign-up' | 'profile'
  >('menu');
  const isAuthenticated: boolean = user !== null;

  useEffect(() => {
    if (isAuthenticated) {
      setState('menu');
    }
  }, [isAuthenticated]);

  let content: ReactNode;

  switch (state) {
    case 'sign-in':
      content = <SignInForm />;
      break;

    case 'sign-up':
      content = <SignUpForm />;
      break;

    case 'menu':
      content = <Menu setState={setState} />;
      break;

    case 'profile':
      content = user ? <Profile user={user} /> : <Menu setState={setState} />;
      break;

    default:
      content = <Menu setState={setState} />;
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
                      await authApi.signOut();
                      setUser(null);
                      setState('menu');
                    } catch (error: unknown) {
                      invokeError(error, 'Une erreur est survenue');
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
    </div>
  );
}
