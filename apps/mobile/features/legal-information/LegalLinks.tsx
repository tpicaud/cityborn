import { type ErrorReporter, useErrorReporter } from '@cityborn/client';
import { CITYBORN_CONTACT_EMAIL } from '@cityborn/core';
import { Linking, Pressable } from 'react-native';
import { Text, View } from '@/components/ui/native/NativeComponents';

export function LegalLinks() {
  const { reportError }: ErrorReporter = useErrorReporter();

  const openLegalLink = async (url: string): Promise<void> => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      reportError(error);
    }
  };

  return (
    <View className="shrink-0 flex-row flex-wrap justify-center gap-x-4 border-t border-neutral-200 py-2">
      <Pressable
        accessibilityRole="link"
        className="min-h-11 justify-center"
        onPress={() => openLegalLink(`mailto:${CITYBORN_CONTACT_EMAIL}`)}
      >
        <Text className="text-sm text-neutral-600 underline">
          Nous contacter
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="link"
        className="min-h-11 justify-center"
        onPress={() =>
          openLegalLink('https://www.cityborn.app/terms-and-policies')
        }
      >
        <Text className="text-sm text-neutral-600 underline">
          Politiques et conditions
        </Text>
      </Pressable>
    </View>
  );
}
