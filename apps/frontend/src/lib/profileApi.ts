import type { ProfileApi } from '@cityborn/client/profile';
import { getGameRecords } from '@/server/use-server/user';

export const profileApi: ProfileApi = { getGameRecords };
