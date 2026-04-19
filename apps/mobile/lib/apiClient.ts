import { ApiClient } from '@cityborn/api';
import { tokenStorage } from './tokenStorage';
import { getBaseUrl } from './utils';

export const apiClient = new ApiClient(getBaseUrl(), tokenStorage);
