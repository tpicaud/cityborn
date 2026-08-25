import { API_MIN_SUPPORTED_VERSION_HEADER_NAME } from '@cityborn/api';
import { createApiClient, setMinSupportedApiVersion } from '@cityborn/client';
import { tokenStorage } from '../tokenStorage';
import { getBaseUrl } from '../utils';

export { tokenStorage };
export const client = createApiClient(getBaseUrl(), tokenStorage, {
  onResponseHeaders: (headers) => {
    const rawMinSupportedVersion = headers.get(
      API_MIN_SUPPORTED_VERSION_HEADER_NAME,
    );
    if (rawMinSupportedVersion === null) {
      return;
    }
    const parsedMinSupportedVersion = Number(rawMinSupportedVersion);
    if (Number.isInteger(parsedMinSupportedVersion)) {
      setMinSupportedApiVersion(parsedMinSupportedVersion);
    }
  },
});
