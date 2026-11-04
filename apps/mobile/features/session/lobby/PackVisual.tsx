import type { Pack } from '@cityborn/api';
import {
  type PackImageFallback,
  usePackImageFallback,
} from '@cityborn/client/session';
import { colors } from '@cityborn/design-system';
import { Image } from 'expo-image';
import { Icon } from '@/components/ui/Icon';
import { View } from '@/components/ui/native/NativeComponents';

const packVisualSize: number = 48;

export function PackVisual({ pack }: { pack: Pack }) {
  const { imageUrl, showNeutralImage }: PackImageFallback =
    usePackImageFallback({ pack });

  if (!imageUrl) {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="size-12 items-center justify-center rounded-md bg-foreground/10"
      >
        <Icon
          name="image_outline"
          size={24}
          color={colors.foreground.DEFAULT}
        />
      </View>
    );
  }

  return (
    <Image
      source={imageUrl}
      contentFit="cover"
      onError={showNeutralImage}
      accessible={false}
      style={{
        width: packVisualSize,
        height: packVisualSize,
        borderRadius: 6,
      }}
    />
  );
}
