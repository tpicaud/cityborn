import type { ApiError } from '@cityborn/api';
import { parseApiError } from '@cityborn/api';

export type SocketEmit = (event: string, ...args: unknown[]) => void;

export type SocketAck = { success: boolean; error?: unknown };

const SOCKET_ERROR_STATUS = 500;

export function toSocketApiError(error: unknown): ApiError {
  return parseApiError(SOCKET_ERROR_STATUS, error);
}

export function emitWithAck(
  emit: SocketEmit,
  event: string,
  body?: Record<string, unknown>,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const handleAck = (ack: SocketAck) => {
      if (ack.success) return resolve();
      reject(toSocketApiError(ack.error));
    };

    if (body === undefined) return emit(event, handleAck);
    emit(event, body, handleAck);
  });
}
