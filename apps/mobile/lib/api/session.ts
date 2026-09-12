import { createSessionApi } from '@cityborn/client/session';
import { client } from './client';

export const sessionApi = createSessionApi(client);
