import { SessionIdSchema } from '@cityborn/api';
import {
  launchedPackIdFromQueryParam,
  launchedPackQueryParam,
} from '@cityborn/client/session';
import { useLocalSearchParams } from 'expo-router';
import ScreenLayout from '@/components/ScreenLayout';
import Session from '@/features/session/Session';

export default function SessionScreen() {
  const params: Record<string, string | string[] | undefined> =
    useLocalSearchParams();

  return (
    <ScreenLayout>
      <Session
        sessionID={SessionIdSchema.parse(params.sessionID)}
        launchedPackId={launchedPackIdFromQueryParam(
          params[launchedPackQueryParam],
        )}
      />
    </ScreenLayout>
  );
}
