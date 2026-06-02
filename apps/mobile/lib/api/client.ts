import {
  createApiClient,
  type HttpSuccessStatus,
  throwOnError,
} from '@cityborn/api';
import { tokenStorage } from '../tokenStorage';
import { getBaseUrl } from '../utils';

export { tokenStorage };
export const client = createApiClient(getBaseUrl(), tokenStorage);

export function assertOk<T extends { status: number; body: unknown }>(
  result: T,
): asserts result is Extract<T, { status: HttpSuccessStatus }> {
  throwOnError(result);
}
