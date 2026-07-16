import { useLocalSearchParams } from 'expo-router';
import ScreenLayout from '@/components/ScreenLayout';
import MultiSession from '@/features/session/multi/MultiSession';

export default function MultiSessionScreen() {
  const { sessionID }: { sessionID: string } = useLocalSearchParams();

  return (
    <ScreenLayout fullBleed>
      <MultiSession sessionID={sessionID} />
    </ScreenLayout>
  );
}
