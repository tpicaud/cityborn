import type { JwtHeader, JwtPayload, SigningKeyCallback } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { z } from 'zod';

const AppleIdTokenClaimsSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email().optional(),
  email_verified: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform(
      (emailVerified: boolean | 'true' | 'false' | undefined) =>
        emailVerified === true || emailVerified === 'true',
    ),
});

export type AppleIdTokenClaims = z.infer<typeof AppleIdTokenClaimsSchema>;

type AppleIdTokenVerification = {
  idToken: string;
  audience: string;
};

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

export async function verifyAppleIdToken({
  idToken,
  audience,
}: AppleIdTokenVerification): Promise<AppleIdTokenClaims | null> {
  const decodedToken: JwtPayload | string | undefined = await new Promise(
    (resolve, reject) => {
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
    },
  );
  const claimsParseResult: z.SafeParseReturnType<unknown, AppleIdTokenClaims> =
    AppleIdTokenClaimsSchema.safeParse(decodedToken);
  return claimsParseResult.success ? claimsParseResult.data : null;
}
