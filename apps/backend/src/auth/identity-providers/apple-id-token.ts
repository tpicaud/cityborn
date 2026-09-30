import type { JwtHeader, JwtPayload, SigningKeyCallback } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

const appleJwksClient = jwksRsa({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  cacheMaxAge: 86400000,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

function getAppleSigningKey(
  header: JwtHeader,
  callback: SigningKeyCallback,
): void {
  appleJwksClient.getSigningKey(header.kid, (err, key?: jwksRsa.SigningKey) => {
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
      getAppleSigningKey,
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
