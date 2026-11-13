import { frontendClientConfig } from '@/config/client';

type GoogleCredentialResponse = { credential: string };
type CredentialHandler = (idToken: string) => void;
type GoogleIdentityServices = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          theme: string;
          size: string;
          text: string;
          locale: string;
          click_listener: () => void;
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

let initialization: Promise<GoogleIdentityServices> | undefined;
let activeHandler: CredentialHandler | undefined;

function initialize(): Promise<GoogleIdentityServices> {
  if (initialization) return initialization;
  initialization = new Promise<GoogleIdentityServices>((resolve, reject) => {
    const complete = (): void => {
      if (!window.google) {
        reject(new Error('Google Identity Services unavailable'));
        return;
      }
      window.google.accounts.id.initialize({
        client_id: frontendClientConfig.googleOAuthWebClientId,
        callback: ({ credential }: GoogleCredentialResponse) =>
          activeHandler?.(credential),
      });
      resolve(window.google);
    };
    if (window.google) {
      complete();
      return;
    }
    const script: HTMLScriptElement = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    const timeout: ReturnType<typeof setTimeout> = setTimeout(() => {
      script.onload = null;
      script.onerror = null;
      script.remove();
      reject(new Error('Google Identity Services timed out'));
    }, 10000);
    script.onload = () => {
      clearTimeout(timeout);
      complete();
    };
    script.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Google Identity Services failed to load'));
    };
    document.head.appendChild(script);
  });
  return initialization;
}

export async function renderGoogleSignInButton({
  container,
  onCredential,
  signal,
}: {
  container: HTMLElement;
  onCredential: CredentialHandler;
  signal: AbortSignal;
}): Promise<void> {
  const google: GoogleIdentityServices = await initialize();
  if (signal.aborted) return;
  activeHandler = onCredential;
  signal.addEventListener(
    'abort',
    () => {
      if (activeHandler === onCredential) activeHandler = undefined;
    },
    { once: true },
  );
  google.accounts.id.renderButton(container, {
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    locale: 'fr',
    click_listener: () => {
      activeHandler = onCredential;
    },
  });
}
