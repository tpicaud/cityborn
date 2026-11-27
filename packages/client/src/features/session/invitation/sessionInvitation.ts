import type { Session } from '@cityborn/api';
import type { ShareContent } from '../../../platform/sharing';
import { joinableSessionPath } from '../sessionPath';

type CreateSessionInvitationOptions = {
  session: Pick<Session, 'id' | 'mode'>;
  webAppUrl: string;
};

export function createSessionInvitation({
  session,
  webAppUrl,
}: CreateSessionInvitationOptions): ShareContent {
  return {
    title: 'Cityborn',
    message: `Rejoins ma partie sur Cityborn ! Code : ${session.id}`,
    url: new URL(joinableSessionPath(session), webAppUrl).href,
  };
}
