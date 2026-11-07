import { useState } from 'react';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';

export function SignInOrSignUp() {
  const [signingUp, setSigningUp] = useState<boolean>(false);

  if (signingUp) return <SignUpForm onSignIn={() => setSigningUp(false)} />;

  return <SignInForm onSignUp={() => setSigningUp(true)} />;
}
