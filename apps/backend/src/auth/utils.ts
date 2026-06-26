import * as cookie from 'cookie';
import type { Request } from 'express';
import type { JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import type { Socket } from 'socket.io';
export function extractTokenFromHTTPHeader(
  request: Request,
): string | undefined {
  const [type, token] = request.headers.authorization?.split(' ') ?? [];
  return type === 'Bearer' ? token : undefined;
}

export function extractAccessTokenFromWsClient(
  client: Socket,
): string | undefined {
  const cookies = client.handshake.headers.cookie;
  const auth = client.handshake.auth;

  if (cookies) {
    const parsedCookies = cookie.parseCookie(cookies);
    return parsedCookies['access_token'];
  }

  if (auth) {
    return auth.access_token;
  }

  return undefined;
}

// Configuration optimale
const client = jwksRsa({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  cacheMaxAge: 86400000, // 24h
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
): Promise<any> {
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
        console.log(decoded);
        resolve(decoded);
      },
    );
  });
}
