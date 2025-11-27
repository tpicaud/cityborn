import { View } from 'react-native';
import MapView from 'react-native-maps';

export default function MapComponent({ mapProps }: { mapProps: any }) {
  return (
    <View className="flex-1">
      <MapView
        provider="google"
        userInterfaceStyle="light"
        style={{ height: '100%', width: '100%' }}
      />
    </View>
  );
}
