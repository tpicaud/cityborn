import type { ProfileApi } from '@cityborn/client/profile';
import { getGameRecords, updateUsername } from '@/server/use-server/user';

export const profileApi: ProfileApi = { getGameRecords, updateUsername };
