import { colors } from '@cityborn/design-system';
import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';
import Button from './Button';
import Dialog from './Dialog';
import { Icon } from './Icon';
import { Text, View } from './native/NativeComponents';

interface ForceUpdateDialogProps {
  visible: boolean;
}

function getStoreUrl(): string {
  const storeUrls = Constants.expoConfig?.extra?.storeUrls;
  const storeUrl = Platform.OS === 'ios' ? storeUrls?.ios : storeUrls?.android;
  if (typeof storeUrl !== 'string') {
    throw new Error('Store URL is missing from app.config.js extra.storeUrls');
  }
  return storeUrl;
}

function ForceUpdateDialog({ visible }: ForceUpdateDialogProps) {
  return (
    <Dialog visible={visible} onClose={() => {}} className="h-auto py-8 px-6">
      <View className="flex justify-center items-center gap-4">
        <Icon name="alert_fill" size={40} color={colors.destructive[500]} />
        <Text className="text-lg text-center">
          Oops ! Tu es en retard... Mets à jour l'application mettre à jour
          Cityborn.
        </Text>
        <Button
          label="Mettre à jour"
          onPress={() => Linking.openURL(getStoreUrl())}
        />
      </View>
    </Dialog>
  );
}

export default ForceUpdateDialog;
