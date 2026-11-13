'use client';

import {
  type IdentityProviderSignIn,
  useIdentityProviderSignIn,
} from '@cityborn/client/auth';
import type { Navigation } from '@cityborn/client/platform';
import { type RefObject, useEffect, useRef, useState } from 'react';
import { Spinner, View } from 'tamagui';
import { frontendClientConfig } from '@/config/client';
import { useNavigation } from '@/lib/navigation';

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
        options: {
          theme?: string;
          size?: string;
          text?: string;
          shape?: string;
          locale?: string;
        },
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
  const navigation: Navigation = useNavigation();
  const { signInWithGoogle }: IdentityProviderSignIn =
    useIdentityProviderSignIn({
      onSignedIn: () => navigation.returnTo('/'),
    });
  const googleButtonContainer: RefObject<HTMLDivElement | null> =
    useRef<HTMLDivElement>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isGoogleButtonReady, setIsGoogleButtonReady] =
    useState<boolean>(false);

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
  }, [signInWithGoogle]);

  return (
    <View items="center" justify="center" minH="11" aria-busy={isSigningIn}>
      <div
        ref={googleButtonContainer}
        style={{ opacity: isGoogleButtonReady ? 1 : 0 }}
      />
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
