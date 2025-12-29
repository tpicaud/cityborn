import ScreenLayout from '@/components/ScreenLayout';
import MultiSession from '@/features/session/multi/MultiSession';
import { useLocalSearchParams } from 'expo-router';

export default function MultiSessionScreen() {
  const { sessionID }: { sessionID: string } = useLocalSearchParams();

  return (
    <ScreenLayout>
      <MultiSession sessionID={sessionID} />
    </ScreenLayout>
  );
}
