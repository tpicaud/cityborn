import { createApiClient } from '@cityborn/api';
import { tokenStorage } from '../tokenStorage';
import { getBaseUrl } from '../utils';

export { tokenStorage };
export const client = createApiClient(getBaseUrl(), tokenStorage);
