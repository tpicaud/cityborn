import { API_MIN_SUPPORTED_VERSION_HEADER_NAME } from '@cityborn/api';
import { createApiClient, setMinSupportedApiVersion } from '@cityborn/client';
import { tokenStorage } from '../tokenStorage';
import { getAppVersion, getBaseUrl } from '../utils';
import { getOrCreateVisitorId } from '../visitorId';

export { tokenStorage };
export const client = createApiClient(getBaseUrl(), tokenStorage, {
  client: { name: 'mobile', version: getAppVersion() },
  getVisitorId: getOrCreateVisitorId,
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
