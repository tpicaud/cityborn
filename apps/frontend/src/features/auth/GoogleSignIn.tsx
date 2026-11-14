'use client';

import {
  type IdentityProviderSignIn,
  useIdentityProviderSignIn,
} from '@cityborn/client/auth';
import { Typography } from '@mui/material';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { frontendClientConfig } from '@/config/client';

type GoogleIdentityScriptStatus = 'loading' | 'ready' | 'failed';

type GoogleCredentialHandler = (
  response: google.accounts.id.CredentialResponse,
) => Promise<void>;

const googleIdentityScriptUrl: string =
  'https://accounts.google.com/gsi/client';
const googleButtonWidth: number = 300;

let isGoogleIdentityInitialized: boolean = false;
let handleGoogleCredential: GoogleCredentialHandler | null = null;

function isGoogleIdentityLoaded(): boolean {
  return typeof google !== 'undefined' && google.accounts?.id !== undefined;
}

function initializeGoogleIdentity(): void {
  if (isGoogleIdentityInitialized) return;

  google.accounts.id.initialize({
    client_id: frontendClientConfig.googleOAuthWebClientId,
    callback: (response: google.accounts.id.CredentialResponse): void => {
      handleGoogleCredential?.(response);
    },
  });
  isGoogleIdentityInitialized = true;
}

export function SignInWithGoogleButton({
  text,
}: {
  text: 'signin_with' | 'signup_with';
}) {
  const { signInWithGoogle }: IdentityProviderSignIn =
    useIdentityProviderSignIn();
  const googleButtonContainer = useRef<HTMLDivElement>(null);
  const [scriptStatus, setScriptStatus] =
    useState<GoogleIdentityScriptStatus>('loading');
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  useEffect(() => {
    const signInWithCredential: GoogleCredentialHandler = async ({
      credential,
    }: google.accounts.id.CredentialResponse): Promise<void> => {
      setIsSigningIn(true);
      try {
        await signInWithGoogle({ idToken: credential });
      } finally {
        setIsSigningIn(false);
      }
    };
    handleGoogleCredential = signInWithCredential;

    return () => {
      if (handleGoogleCredential === signInWithCredential) {
        handleGoogleCredential = null;
      }
    };
  }, [signInWithGoogle]);

  useEffect(() => {
    const container: HTMLDivElement | null = googleButtonContainer.current;
    if (scriptStatus !== 'ready' || !container) return;

    initializeGoogleIdentity();
    google.accounts.id.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text,
      locale: 'fr',
      width: googleButtonWidth,
    });
  }, [scriptStatus, text]);

  const settleScriptStatus: () => void = (): void =>
    setScriptStatus(isGoogleIdentityLoaded() ? 'ready' : 'failed');

  return (
    <div className="relative flex justify-center items-center h-[44px] w-full">
      <Script
        src={googleIdentityScriptUrl}
        onLoad={settleScriptStatus}
        onReady={settleScriptStatus}
        onError={() => setScriptStatus('failed')}
      />
      {scriptStatus === 'failed' ? (
        <Typography variant="body2" color="error" align="center">
          La connexion avec Google est indisponible pour le moment.
        </Typography>
      ) : (
        <div ref={googleButtonContainer} />
      )}
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
