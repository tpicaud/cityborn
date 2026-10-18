'use client';

import {
  type IdentityProviderSignIn,
  useIdentityProviderSignIn,
} from '@cityborn/client/auth';
import { useEffect, useRef, useState } from 'react';
import { frontendClientConfig } from '@/config/client';

type GoogleCredentialResponse = { credential: string };

type GoogleIdentityServices = {
  accounts: {
    id: {
      initialize: (config: {
        client_id?: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: { theme?: string; size?: string; text?: string },
      ) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

export function SignInWithGoogleButton() {
  const { signInWithGoogle }: IdentityProviderSignIn =
    useIdentityProviderSignIn();
  const googleButtonContainer = useRef<HTMLDivElement>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  useEffect(() => {
    const container: HTMLDivElement | null = googleButtonContainer.current;
    if (!window.google || !container) return;

    window.google.accounts.id.initialize({
      client_id: frontendClientConfig.googleOAuthWebClientId,
      callback: async ({ credential }: GoogleCredentialResponse) => {
        setIsSigningIn(true);
        try {
          await signInWithGoogle({ idToken: credential });
        } finally {
          setIsSigningIn(false);
        }
      },
    });
    window.google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
    });
  }, [signInWithGoogle]);

  return (
    <div className="relative flex justify-center items-center h-[44px] w-full">
      <div ref={googleButtonContainer}></div>
      {isSigningIn && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded">
          <svg
            aria-label="Chargement"
            className="animate-spin h-5 w-5 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
