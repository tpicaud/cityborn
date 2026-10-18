import { ApiResponseError, ErrorCode } from '@cityborn/api';
import type { SessionChannel } from '../../domains/session/sessionApi';

const WS_NOT_CONNECTED_STATUS = 503;

export function requireOpenedSessionChannel({
  sessionChannel,
  action,
}: {
  sessionChannel: SessionChannel | null;
  action: string;
}): SessionChannel {
  if (!sessionChannel)
    throw new ApiResponseError({
      code: ErrorCode.WS_NOT_CONNECTED,
      statusCode: WS_NOT_CONNECTED_STATUS,
      message: `${action} failed: connection not opened`,
    });
  return sessionChannel;
}
