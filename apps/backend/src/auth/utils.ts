import * as cookie from 'cookie';
import type { Request } from 'express';
import type { JwtHeader, JwtPayload, SigningKeyCallback } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import type { Socket } from 'socket.io';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  LEGACY_FRONTEND_ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from './auth.constants';

export function extractTokenFromHTTPHeader(
  request: Request,
): string | undefined {
  const [type, token] = request.headers.authorization?.split(' ') ?? [];
  return type === 'Bearer' ? token : undefined;
}

function extractCookie(
  cookieHeader: string | undefined,
  cookieName: string,
): string | undefined {
  if (cookieHeader === undefined) {
    return undefined;
  }
  return cookie.parseCookie(cookieHeader)[cookieName];
}

export function extractAccessTokenFromHttpRequest(
  request: Request,
): string | undefined {
  return (
    extractTokenFromHTTPHeader(request) ??
    extractCookie(request.headers.cookie, ACCESS_TOKEN_COOKIE_NAME)
  );
}

export function extractRefreshTokenFromCookie(
  request: Request,
): string | undefined {
  return extractCookie(request.headers.cookie, REFRESH_TOKEN_COOKIE_NAME);
}

export function hasAuthenticationCookie(request: Request): boolean {
  return (
    extractCookie(request.headers.cookie, ACCESS_TOKEN_COOKIE_NAME) !==
      undefined ||
    extractCookie(request.headers.cookie, REFRESH_TOKEN_COOKIE_NAME) !==
      undefined
  );
}

export function extractAccessTokenFromWsClient(
  client: Socket,
): string | undefined {
  const cookieHeader: string | undefined = client.handshake.headers.cookie;
  const handshakeAccessToken: unknown = client.handshake.auth?.access_token;

  return (
    extractCookie(cookieHeader, ACCESS_TOKEN_COOKIE_NAME) ??
    extractCookie(cookieHeader, LEGACY_FRONTEND_ACCESS_TOKEN_COOKIE_NAME) ??
    (typeof handshakeAccessToken === 'string'
      ? handshakeAccessToken
      : undefined)
  );
}

const client = jwksRsa({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  cacheMaxAge: 86400000,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

function getKey(header: JwtHeader, callback: SigningKeyCallback): void {
  client.getSigningKey(header.kid, (err, key?: jwksRsa.SigningKey) => {
    if (err) {
      return callback(err);
    }

    if (!key) {
      return callback(new Error('No signing key found'));
    }

    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

export async function verifyAppleIdToken(
  idToken: string,
  audience: string,
): Promise<JwtPayload | string | undefined> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      getKey,
      {
        issuer: 'https://appleid.apple.com',
        audience: audience,
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      },
    );
  });
}
