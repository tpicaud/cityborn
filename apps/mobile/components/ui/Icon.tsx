import Ionicons from '@expo/vector-icons/Ionicons';
import type { ColorValue } from 'react-native';

const ICONS = {
  home_fill: {
    ionicons: 'home',
  },
  home_outline: {
    ionicons: 'home-outline',
  },
  gamepad_fill: {
    ionicons: 'game-controller',
  },
  gamepad_outline: {
    ionicons: 'game-controller-outline',
  },
  profile_fill: {
    ionicons: 'person',
  },
  profile_outline: {
    ionicons: 'person-outline',
  },
  components_fill: {
    ionicons: 'albums',
  },
  alert_outline: {
    ionicons: 'alert-circle-outline',
  },
  alert_fill: {
    ionicons: 'alert-circle',
  },
  clipboard_outline: {
    ionicons: 'clipboard-outline',
  },
  clipboard_fill: {
    ionicons: 'clipboard',
  },
  image_outline: {
    ionicons: 'image-outline',
  },
  arrow_back_outline: {
    ionicons: 'arrow-back-outline',
  },
  arrow_back_fill: {
    ionicons: 'arrow-back',
  },
  chevron_back_outline: {
    ionicons: 'chevron-back-outline',
  },
  chevron_back_fill: {
    ionicons: 'chevron-back',
  },
};

type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  size?: number;
  color?: ColorValue;
};

export function Icon({ name, size, color }: IconProps) {
  return (
    <Ionicons
      name={ICONS[name].ionicons as keyof typeof Ionicons.glyphMap}
      size={size}
      color={color}
    />
  );
}
