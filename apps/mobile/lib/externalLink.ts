import { type ErrorReporter, useErrorReporter } from '@cityborn/client';
import { Linking } from 'react-native';

export type ExternalLinkOpener = (url: string) => Promise<void>;

export function useExternalLinkOpener(): ExternalLinkOpener {
  const { reportError }: ErrorReporter = useErrorReporter();

  return async (url: string): Promise<void> => {
    try {
      await Linking.openURL(url);
    } catch (error: unknown) {
      reportError(error, 'Impossible d’ouvrir ce lien sur cet appareil.');
    }
  };
}
