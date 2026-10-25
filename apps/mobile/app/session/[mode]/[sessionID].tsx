import { SessionIdSchema } from '@cityborn/api';
import { useLocalSearchParams } from 'expo-router';
import ScreenLayout from '@/components/ScreenLayout';
import Session from '@/features/session/Session';

export default function SessionScreen() {
  const { sessionID }: { sessionID: string } = useLocalSearchParams();

  return (
    <ScreenLayout fullBleed>
      <Session sessionID={SessionIdSchema.parse(sessionID)} />
    </ScreenLayout>
  );
}
