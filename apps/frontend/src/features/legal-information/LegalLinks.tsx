import { CITYBORN_CONTACT_EMAIL } from '@cityborn/core';
import { Anchor, View } from 'tamagui';

type LegalLinksProps = { onDarkBackground?: boolean };

export function LegalLinks({ onDarkBackground = false }: LegalLinksProps) {
  const color: 'white' | 'black' = onDarkBackground ? 'white' : 'black';
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
        href={`mailto:${CITYBORN_CONTACT_EMAIL}`}
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
        href="/terms-and-policies"
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
