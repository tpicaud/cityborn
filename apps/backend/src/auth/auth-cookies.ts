import * as cookie from 'cookie';

export const ACCESS_TOKEN_COOKIE_NAME = 'cityborn_access_token';
export const REFRESH_TOKEN_COOKIE_NAME = 'cityborn_refresh_token';
export const LEGACY_FRONTEND_ACCESS_TOKEN_COOKIE_NAME = 'access_token';

export const ACCESS_TOKEN_COOKIE_PATH = '/';
export const REFRESH_TOKEN_COOKIE_PATH = '/auth';

function extractCookie(
  cookieHeader: string | undefined,
  cookieName: string,
): string | undefined {
  if (cookieHeader === undefined) {
    return undefined;
  }
  return cookie.parseCookie(cookieHeader)[cookieName];
}

export function extractAccessTokenFromCookieHeader(
  cookieHeader: string | undefined,
): string | undefined {
  return extractCookie(cookieHeader, ACCESS_TOKEN_COOKIE_NAME);
}

export function extractLegacyFrontendAccessTokenFromCookieHeader(
  cookieHeader: string | undefined,
): string | undefined {
  return extractCookie(cookieHeader, LEGACY_FRONTEND_ACCESS_TOKEN_COOKIE_NAME);
}

export function extractRefreshTokenFromCookieHeader(
  cookieHeader: string | undefined,
): string | undefined {
  return extractCookie(cookieHeader, REFRESH_TOKEN_COOKIE_NAME);
}

export function hasAuthenticationCookie(
  cookieHeader: string | undefined,
): boolean {
  return (
    extractAccessTokenFromCookieHeader(cookieHeader) !== undefined ||
    extractRefreshTokenFromCookieHeader(cookieHeader) !== undefined
  );
}
