'use client';

import { type CurrentUser, useCurrentUser } from '@cityborn/client/auth';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import IconButton from '@/components/ui/buttons/IconButton';
import MapBackdropCard from '@/components/ui/cards/MapBackdropCard';
import Home from '@/features/auth/Home';
import { SignInForm } from '@/features/auth/SignInForm';
import SignOutButton from '@/features/auth/SignOutButton';
import { SignUpForm } from '@/features/auth/SignUpForm';
import { Profile } from '@/features/profile/Profile';
import Play from '@/features/session/Play';

type HomePanel = 'home' | 'sign-in' | 'sign-up' | 'profile';

export default function HomePage() {
  const { user }: CurrentUser = useCurrentUser();
  const [panel, setPanel] = useState<HomePanel>('home');
  const isAuthenticated: boolean = user !== null;
  const openHome: () => void = (): void => setPanel('home');
  const openSignIn: () => void = (): void => setPanel('sign-in');
  const openSignUp: () => void = (): void => setPanel('sign-up');

  useEffect(() => {
    if (isAuthenticated) {
      setPanel('home');
    }
  }, [isAuthenticated]);

  const homeContent: ReactNode = (
    <div className="flex flex-col items-center gap-5">
      <Home openSignIn={openSignIn} openSignUp={openSignUp} />
      <Play />
    </div>
  );

  let content: ReactNode;

  switch (panel) {
    case 'sign-in':
      content = <SignInForm />;
      break;

    case 'sign-up':
      content = <SignUpForm openSignIn={openSignIn} />;
      break;

    case 'profile':
      content = user ? <Profile user={user} /> : homeContent;
      break;

    default:
      content = homeContent;
  }

  return (
    <MapBackdropCard
      onBack={panel === 'home' ? undefined : openHome}
      actions={
        <>
          <IconButton
            onClick={() => setPanel('profile')}
            sx={{
              visibility: user && panel === 'home' ? 'visible' : 'hidden',
            }}
            className="z-10"
          >
            <AccountCircleIcon />
          </IconButton>
          <SignOutButton onSignedOut={openHome} />
        </>
      }
    >
      {content}
    </MapBackdropCard>
  );
}
