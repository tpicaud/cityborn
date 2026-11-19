import { type SessionId, SessionIdSchema } from '@cityborn/api';
import { useLocalSearchParams } from 'expo-router';
import ScreenLayout from '@/components/ScreenLayout';
import Session from '@/features/session/Session';

export default function SessionScreen() {
  const params: { sessionID: string } = useLocalSearchParams();
  const sessionID: SessionId = SessionIdSchema.parse(params.sessionID);

  return (
    <ScreenLayout fullBleed>
      <Session key={sessionID} sessionID={sessionID} />
    </ScreenLayout>
  );
}
