import { ApiClient } from '@cityborn/api';
import { MobileTokenStorage } from './tokenStorage';
import { getBaseUrl } from './utils';

const tokenStorage = new MobileTokenStorage();

export const apiClient = new ApiClient(getBaseUrl(), tokenStorage);
