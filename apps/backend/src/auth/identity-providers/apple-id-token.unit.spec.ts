import { type AppleIdTokenClaims, verifyAppleIdToken } from './apple-id-token';

describe('verifyAppleIdToken', () => {
  it('returns null for a malformed token', async () => {
    const claims: AppleIdTokenClaims | null = await verifyAppleIdToken({
      idToken: 'not-a-jwt',
      audience: 'cityborn-app',
    });

    expect(claims).toBeNull();
  });
});
