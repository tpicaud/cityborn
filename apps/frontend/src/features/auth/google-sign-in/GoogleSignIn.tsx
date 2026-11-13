'use client';

import {
  type IdentityProviderSignIn,
  useIdentityProviderSignIn,
} from '@cityborn/client/auth';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { GoogleEmailVerification } from './GoogleEmailVerification';
import { renderGoogleSignInButton } from './googleIdentity';

export function SignInWithGoogleButton() {
  const flow: IdentityProviderSignIn = useIdentityProviderSignIn();
  const googleButtonContainer = useRef<HTMLDivElement>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isUnavailable, setIsUnavailable] = useState<boolean>(false);
  const signIn = useEffectEvent(async (idToken: string): Promise<void> => {
    setIsSigningIn(true);
    try {
      await flow.signInWithGoogle({ idToken });
    } finally {
      setIsSigningIn(false);
    }
  });

  useEffect(() => {
    const container: HTMLDivElement | null = googleButtonContainer.current;
    if (!container || flow.googleEmailVerificationRequired) return;
    const controller: AbortController = new AbortController();
    void renderGoogleSignInButton({
      container,
      signal: controller.signal,
      onCredential: (idToken: string) => {
        void signIn(idToken);
      },
    }).catch(() => {
      if (!controller.signal.aborted) setIsUnavailable(true);
    });
    return () => {
      controller.abort();
      container.replaceChildren();
    };
  }, [flow.googleEmailVerificationRequired]);

  if (flow.googleEmailVerificationRequired)
    return <GoogleEmailVerification flow={flow} />;
  if (isUnavailable)
    return (
      <p role="alert">
        La connexion Google est indisponible. Vérifiez votre connexion puis
        rechargez la page.
      </p>
    );

  return (
    <div
      className="relative flex justify-center items-center min-h-[44px] w-full"
      aria-busy={isSigningIn}
    >
      <div ref={googleButtonContainer} />
      {isSigningIn && (
        <div
          role="status"
          className="absolute inset-0 flex items-center justify-center bg-white/70 rounded"
        >
          Connexion en cours…
        </div>
      )}
    </div>
  );
}
