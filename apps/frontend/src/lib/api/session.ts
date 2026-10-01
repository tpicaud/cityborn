import { createSessionApi, type SessionApi } from '@cityborn/client/session';
import { apiClient } from './client';

export const sessionApi: SessionApi = createSessionApi(apiClient);
