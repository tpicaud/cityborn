import {
  type ApiVersionInfo,
  getApiVersionInfo,
  isApiVersionOutdated,
} from '@cityborn/api';
import { type ApiVersionSupport, useApiVersionSupport } from '@cityborn/client';
import { colors } from '@cityborn/design-system';
import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { Text, View } from '@/components/ui/native/NativeComponents';

const localApiVersionInfo: ApiVersionInfo = getApiVersionInfo();

function getStoreUrl(): string {
  const storeUrls = Constants.expoConfig?.extra?.storeUrls;
  const storeUrl = Platform.OS === 'ios' ? storeUrls?.ios : storeUrls?.android;
  if (typeof storeUrl !== 'string') {
    throw new Error('Store URL is missing from app.config.js extra.storeUrls');
  }
  return storeUrl;
}

function ForceUpdateDialog() {
  const { minSupportedApiVersion }: ApiVersionSupport = useApiVersionSupport();
  const isForceUpdateRequired: boolean =
    minSupportedApiVersion !== null &&
    isApiVersionOutdated(
      localApiVersionInfo.currentVersion,
      minSupportedApiVersion,
    );

  return (
    <Dialog
      visible={isForceUpdateRequired}
      onClose={() => {}}
      className="h-auto py-8 px-6"
    >
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
