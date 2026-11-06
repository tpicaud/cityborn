import type { PlayerId } from '@cityborn/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View } from '@/components/ui/native/NativeComponents';

type PlayerDepartureNoticeProps = {
  departedPlayerIDs: PlayerId[];
};

export function PlayerDepartureNotice({
  departedPlayerIDs,
}: PlayerDepartureNoticeProps) {
  const insets = useSafeAreaInsets();

  if (departedPlayerIDs.length === 0) return null;

  return (
    <View
      pointerEvents="none"
      className="absolute left-0 right-0 items-center"
      style={{ top: insets.top + 8, zIndex: 40 }}
    >
      <View className="px-4 py-2 rounded-full bg-black/70">
        {departedPlayerIDs.map((playerID) => (
          <Text key={playerID} className="text-white text-center">
            {playerID} a quitté la partie
          </Text>
        ))}
      </View>
    </View>
  );
}
