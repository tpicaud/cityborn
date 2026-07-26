import type { NativeStackHeaderProps } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { View } from '@/components/ui/native/NativeComponents';

export default function CustomHeader({
  back,
  navigation,
}: NativeStackHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: insets.top,
      }}
      className="bg-transparent px-4"
    >
      {back && (
        <TouchableOpacity onPressIn={navigation.goBack} className="mt-4">
          <Icon name="arrow_back_outline" size={28} />
        </TouchableOpacity>
      )}
    </View>
  );
}
