import {
  ApiResponseError,
  AuthResponseSchema,
  contract,
  ErrorCode,
  parseApiError,
} from '@cityborn/api';
import type { AppRouteMutation } from '@ts-rest/core';
import type { TokenStorage } from '../platform/tokenStorage';

export interface AuthRouteResponse {
  status: number;
  body: unknown;
}

export type SendAuthRequest = (
  route: AppRouteMutation,
  bearerToken: string | null,
) => Promise<AuthRouteResponse>;

export interface AuthTransport {
  readAccessToken(): Promise<string | null>;
  refreshAuthentication(sendAuthRequest: SendAuthRequest): Promise<void>;
  clearAuthentication(sendAuthRequest: SendAuthRequest): Promise<void>;
}

function toApiResponseError(response: AuthRouteResponse): ApiResponseError {
  return new ApiResponseError(parseApiError(response.status, response.body));
}

export function createBearerAuthTransport(
  tokenStorage: TokenStorage,
): AuthTransport {
  return {
    async readAccessToken() {
      return await tokenStorage.getAccessToken();
    },

    async refreshAuthentication(sendAuthRequest) {
      const refreshToken: string | null = await tokenStorage.getRefreshToken();
      if (!refreshToken) {
        throw new ApiResponseError({
          code: ErrorCode.USER_REFRESH_FAILED,
          message: 'No refresh token available',
          statusCode: 401,
        });
      }

      const response: AuthRouteResponse = await sendAuthRequest(
        contract.auth.refresh,
        refreshToken,
      );
      if (response.status !== 200) {
        throw toApiResponseError(response);
      }

      const parsed = AuthResponseSchema.safeParse(response.body);
      if (!parsed.success) {
        throw new ApiResponseError({
          code: ErrorCode.UNKNOWN_ERROR,
          message: 'Unexpected error',
          statusCode: response.status,
        });
      }
      await tokenStorage.setTokens(
        parsed.data.access_token,
        parsed.data.refresh_token,
      );
    },

    async clearAuthentication() {
      await tokenStorage.clearTokens();
    },
  };
}

export function createCookieAuthTransport(): AuthTransport {
  return {
    async readAccessToken() {
      return null;
    },

    async refreshAuthentication(sendAuthRequest) {
      const response: AuthRouteResponse = await sendAuthRequest(
        contract.auth.cookie.refresh,
        null,
      );
      if (response.status !== 200) {
        throw toApiResponseError(response);
      }
    },

    async clearAuthentication(sendAuthRequest) {
      try {
        await sendAuthRequest(contract.auth.signOut, null);
      } catch {}
    },
  };
}
