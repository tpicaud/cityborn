import { ApiClient } from '@cityborn/api';
import { getBaseUrl } from './utils';
import { tokenStorage } from './tokenStorage';

export const apiClient = new ApiClient(getBaseUrl(), tokenStorage);
