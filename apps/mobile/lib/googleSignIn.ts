import { UserFacingError } from '@cityborn/api';
import {
  GoogleOneTapSignIn,
  isCancelledResponse,
  isSuccessResponse,
  type OneTapResponse,
} from 'react-native-nitro-google-signin';
import { mobileClientConfig } from '@/config/client';

GoogleOneTapSignIn.configure({
  webClientId: mobileClientConfig.googleOAuthWebClientId,
  iosClientId: mobileClientConfig.googleOAuthIosClientId,
  autoSelectOnSignIn: false,
});

export async function requestGoogleIdToken(): Promise<string | null> {
  await GoogleOneTapSignIn.checkPlayServices();
  const response: OneTapResponse =
    await GoogleOneTapSignIn.presentExplicitSignIn();
  if (isCancelledResponse(response)) return null;
  if (!isSuccessResponse(response))
    throw new UserFacingError('La connexion avec Google a échoué.');
  const idToken: string | null = response.data.idToken;
  if (!idToken)
    throw new UserFacingError(
      'Google n’a pas fourni de jeton d’identité. Veuillez réessayer.',
    );
  return idToken;
}

export async function clearGoogleSession(): Promise<void> {
  await GoogleOneTapSignIn.signOut();
}
