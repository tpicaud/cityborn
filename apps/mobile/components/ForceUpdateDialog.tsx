import {
  type ApiVersionInfo,
  getApiVersionInfo,
  isApiVersionOutdated,
} from '@cityborn/api';
import { type ApiVersionSupport, useApiVersionSupport } from '@cityborn/client';
import { BodyText, Button, Popup } from '@cityborn/design-system';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { View } from 'tamagui';
import {
  type ExternalLinkOpener,
  useExternalLinkOpener,
} from '@/lib/externalLink';

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
  const openExternalLink: ExternalLinkOpener = useExternalLinkOpener();
  const isForceUpdateRequired: boolean =
    minSupportedApiVersion !== null &&
    isApiVersionOutdated(
      localApiVersionInfo.currentVersion,
      minSupportedApiVersion,
    );

  return (
    <Popup open={isForceUpdateRequired} title="Mise à jour">
      <View gap="4">
        <BodyText>
          Une nouvelle version de Cityborn t’attend. Mets à jour l’app pour
          continuer à jouer.
        </BodyText>
        <Button
          compact
          label="Mettre à jour"
          onPress={() => openExternalLink(getStoreUrl())}
        />
      </View>
    </Popup>
  );
}

export default ForceUpdateDialog;
