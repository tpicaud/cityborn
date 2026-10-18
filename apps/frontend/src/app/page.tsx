'use client';

import { type CurrentUser, useCurrentUser } from '@cityborn/client/auth';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import IconButton from '@/components/ui/buttons/IconButton';
import Home from '@/features/auth/Home';
import { SignInForm } from '@/features/auth/SignInForm';
import SignOutButton from '@/features/auth/SignOutButton';
import { SignUpForm } from '@/features/auth/SignUpForm';
import { Profile } from '@/features/profile/Profile';
import Play from '@/features/session/Play';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false },
);

type HomePanel = 'menu' | 'sign-in' | 'sign-up' | 'profile';

export default function HomePage() {
  const { user }: CurrentUser = useCurrentUser();
  const [panel, setPanel] = useState<HomePanel>('menu');
  const isAuthenticated: boolean = user !== null;
  const openSignIn: () => void = (): void => setPanel('sign-in');
  const openSignUp: () => void = (): void => setPanel('sign-up');

  useEffect(() => {
    if (isAuthenticated) {
      setPanel('menu');
    }
  }, [isAuthenticated]);

  const menu: ReactNode = (
    <div className="flex flex-col items-center gap-5">
      <Home openSignIn={openSignIn} openSignUp={openSignUp} />
      <Play openSignIn={openSignIn} openSignUp={openSignUp} />
    </div>
  );

  let content: ReactNode;

  switch (panel) {
    case 'sign-in':
      content = <SignInForm />;
      break;

    case 'sign-up':
      content = <SignUpForm />;
      break;

    case 'profile':
      content = user ? <Profile user={user} /> : menu;
      break;

    default:
      content = menu;
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
                onClick={() => setPanel('menu')}
                sx={{
                  visibility: panel === 'menu' ? 'hidden' : 'visible',
                }}
                className="z-10"
              >
                <ArrowBackIcon />
              </IconButton>

              <div className="flex flex-row justify-end">
                <IconButton
                  onClick={() => setPanel('profile')}
                  sx={{
                    visibility: user && panel === 'menu' ? 'visible' : 'hidden',
                  }}
                  className="z-10"
                >
                  <AccountCircleIcon />
                </IconButton>
                <SignOutButton onSignedOut={() => setPanel('menu')} />
              </div>
            </div>
          </div>
          {content}
        </Box>
      </div>
    </div>
  );
}
