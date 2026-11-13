'use client';

import { ProviderButtonGroup } from '@cityborn/design-system';
import { useState } from 'react';
import { LegalLinks } from '@/features/legal-information/LegalLinks';
import { AuthScreen } from './AuthScreen';
import { SignInForm } from './SignInForm';
import { SignInWithGoogleButton } from './SignInWithGoogleButton';
import { SignUpForm } from './SignUpForm';

export function SignInOrSignUp() {
  const [signingUp, setSigningUp] = useState<boolean>(false);

  return (
    <AuthScreen title={signingUp ? 'Inscription' : 'Connexion'}>
      {signingUp ? (
        <SignUpForm onSignIn={() => setSigningUp(false)} />
      ) : (
        <SignInForm onSignUp={() => setSigningUp(true)} />
      )}
      <ProviderButtonGroup>
        <SignInWithGoogleButton />
      </ProviderButtonGroup>
      {!signingUp && <LegalLinks onDarkBackground />}
    </AuthScreen>
  );
}
