import { useState } from 'react';
import { AuthScreen } from './AuthScreen';
import { SignInForm } from './SignInForm';
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
    </AuthScreen>
  );
}
