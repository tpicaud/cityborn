import { type ErrorReporter, useErrorReporter } from '@cityborn/client';
import { CITYBORN_CONTACT_EMAIL } from '@cityborn/core';
import { Linking } from 'react-native';
import { Anchor, View } from 'tamagui';

type LegalLinksProps = { onDarkBackground?: boolean };

export function LegalLinks({ onDarkBackground = false }: LegalLinksProps) {
  const { reportError }: ErrorReporter = useErrorReporter();
  const color: 'white' | 'black' = onDarkBackground ? 'white' : 'black';

  const openLegalLink = async (url: string): Promise<void> => {
    try {
      await Linking.openURL(url);
    } catch (error: unknown) {
      reportError(error, 'Impossible d’ouvrir ce lien sur cet appareil.');
    }
  };

  return (
    <View
      disableOptimization
      flexDirection="row"
      flexWrap="wrap"
      justify="center"
      gap="4"
      py="2"
    >
      <Anchor
        onPress={() => void openLegalLink(`mailto:${CITYBORN_CONTACT_EMAIL}`)}
        color={color}
        fontFamily="body"
        fontSize="4"
        minH="11"
        py="2"
        textDecorationLine="underline"
      >
        Nous contacter
      </Anchor>
      <Anchor
        onPress={() =>
          void openLegalLink('https://www.cityborn.app/terms-and-policies')
        }
        color={color}
        fontFamily="body"
        fontSize="4"
        minH="11"
        py="2"
        textDecorationLine="underline"
      >
        Politiques et conditions
      </Anchor>
    </View>
  );
}
