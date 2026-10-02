import { createSessionApi, type SessionApi } from '@cityborn/client/session';
import { contractClient } from './contractClient';

export const sessionApi: SessionApi = createSessionApi(contractClient);
