'use client';

import {
  type IdentityProviderSignIn,
  useIdentityProviderSignIn,
} from '@cityborn/client/auth';
import type { Navigation } from '@cityborn/client/platform';
import { BodyText } from '@cityborn/design-system';
import Script from 'next/script';
import { type RefObject, useEffect, useRef, useState } from 'react';
import { Spinner, View } from 'tamagui';
import { frontendClientConfig } from '@/config/client';
import { useNavigation } from '@/lib/navigation';

type GoogleIdentityScriptStatus = 'loading' | 'ready' | 'failed';

type GoogleCredentialHandler = (
  response: google.accounts.id.CredentialResponse,
) => Promise<void>;

const googleIdentityScriptUrl: string =
  'https://accounts.google.com/gsi/client';

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

export function SignInWithGoogleButton() {
  const navigation: Navigation = useNavigation();
  const { signInWithGoogle }: IdentityProviderSignIn =
    useIdentityProviderSignIn({
      onSignedIn: () => navigation.returnTo('/'),
    });
  const googleButtonContainer: RefObject<HTMLDivElement | null> =
    useRef<HTMLDivElement>(null);
  const [scriptStatus, setScriptStatus] =
    useState<GoogleIdentityScriptStatus>('loading');
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isGoogleButtonReady, setIsGoogleButtonReady] =
    useState<boolean>(false);

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
      text: 'continue_with',
      shape: 'pill',
      locale: 'fr',
    });

    const googleButtonObserver: MutationObserver = new MutationObserver(() => {
      if (container.querySelector('[role="button"]')) return;
      setIsGoogleButtonReady(true);
      googleButtonObserver.disconnect();
    });
    googleButtonObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => googleButtonObserver.disconnect();
  }, [scriptStatus]);

  const settleScriptStatus: () => void = (): void =>
    setScriptStatus(isGoogleIdentityLoaded() ? 'ready' : 'failed');

  return (
    <View items="center" justify="center" minH="11" aria-busy={isSigningIn}>
      <Script
        src={googleIdentityScriptUrl}
        onLoad={settleScriptStatus}
        onReady={settleScriptStatus}
        onError={() => setScriptStatus('failed')}
      />
      {scriptStatus === 'failed' ? (
        <BodyText>
          La connexion avec Google est indisponible pour le moment.
        </BodyText>
      ) : (
        <div
          ref={googleButtonContainer}
          inert={!isGoogleButtonReady}
          style={{ opacity: isGoogleButtonReady ? 1 : 0 }}
        />
      )}
      {isSigningIn && (
        <View
          position="absolute"
          t="0"
          l="0"
          r="0"
          b="0"
          items="center"
          justify="center"
          bg="panel-fill"
        >
          <Spinner color="white" />
        </View>
      )}
    </View>
  );
}
