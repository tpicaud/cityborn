import { type ErrorReporter, useErrorReporter } from '@cityborn/client';
import { CITYBORN_CONTACT_EMAIL } from '@cityborn/core';
import { FooterLink, FooterLinks } from '@cityborn/design-system';
import { Linking } from 'react-native';

type LegalLinksProps = { onDarkBackground?: boolean };

export function LegalLinks({ onDarkBackground = false }: LegalLinksProps) {
  const { reportError }: ErrorReporter = useErrorReporter();

  const openLegalLink = async (url: string): Promise<void> => {
    try {
      await Linking.openURL(url);
    } catch (error: unknown) {
      reportError(error, 'Impossible d’ouvrir ce lien sur cet appareil.');
    }
  };

  return (
    <FooterLinks>
      <FooterLink
        onPress={() => void openLegalLink(`mailto:${CITYBORN_CONTACT_EMAIL}`)}
        onDarkBackground={onDarkBackground}
      >
        Nous contacter
      </FooterLink>
      <FooterLink
        onPress={() =>
          void openLegalLink('https://www.cityborn.app/terms-and-policies')
        }
        onDarkBackground={onDarkBackground}
      >
        Politiques et conditions
      </FooterLink>
    </FooterLinks>
  );
}
