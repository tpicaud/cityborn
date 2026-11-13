import {
  type AccountType,
  buildUser,
  type ConfirmGoogleEmail,
  ErrorCode,
  type User,
} from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import type { AuthSession } from '../../common/types/auth-session';
import type { UserService } from '../../user/user.service';
import type { AuthenticatedSocketService } from '../../ws-handshake/authenticated-socket.service';
import type {
  GoogleIdentity,
  IdentityTokenService,
} from '../identity-providers/identity-token.service';
import {
  type GoogleAuthentication,
  GoogleAuthService,
} from './google-auth.service';
import type {
  GoogleEmailProof,
  GoogleEmailProofService,
} from './google-email-proof.service';

const identity: GoogleIdentity = {
  subject: 'google-subject',
  email: 'alice@gmail.com',
  name: 'Alice',
  isEmailAuthoritative: true,
};
const confirmation: ConfirmGoogleEmail = {
  challengeId: 'challenge-id',
  code: '123456',
};
const identityService: DeepMocked<IdentityTokenService> =
  createMock<IdentityTokenService>();
const userService: DeepMocked<UserService> = createMock<UserService>();
const proofService: DeepMocked<GoogleEmailProofService> =
  createMock<GoogleEmailProofService>();
const socketService: DeepMocked<AuthenticatedSocketService> =
  createMock<AuthenticatedSocketService>();
const service: GoogleAuthService = new GoogleAuthService(
  identityService,
  userService,
  proofService,
  socketService,
);

beforeEach(() => {
  jest.resetAllMocks();
  identityService.verifyGoogleIdToken.mockResolvedValue(identity);
  userService.findByGoogleSubject.mockResolvedValue(null);
  userService.findGoogleEmailOwner.mockResolvedValue(null);
});

describe('GoogleAuthService.signIn', () => {
  it('uses the subject before email after a Google email change', async () => {
    const user: User = buildUser({ email: 'old@gmail.com' });
    const session: AuthSession = { user, authVersion: 4 };
    userService.findByGoogleSubject.mockResolvedValue(session);

    expect(await service.signIn({ idToken: 'token' })).toEqual({
      session,
      isNewAccount: false,
    });

    expect(userService.findGoogleEmailOwner).not.toHaveBeenCalled();
    expect(userService.createUser).not.toHaveBeenCalled();
  });

  it.each<AccountType>(['email', 'google', 'apple'])(
    'requires email proof for an existing %s account',
    async (type) => {
      userService.findGoogleEmailOwner.mockResolvedValue(buildUser({ type }));

      await expect(service.signIn({ idToken: 'token' })).rejects.toMatchObject({
        response: { code: ErrorCode.USER_GOOGLE_EMAIL_PROOF_REQUIRED },
      });

      expect(userService.associateGoogleAccount).not.toHaveBeenCalled();
      expect(userService.createUser).not.toHaveBeenCalled();
    },
  );

  it('requires current ownership of a new external email before account creation', async () => {
    identityService.verifyGoogleIdToken.mockResolvedValue({
      ...identity,
      email: 'alice@example.com',
      isEmailAuthoritative: false,
    });

    await expect(service.signIn({ idToken: 'token' })).rejects.toMatchObject({
      response: { code: ErrorCode.USER_GOOGLE_EMAIL_PROOF_REQUIRED },
    });

    expect(userService.createUser).not.toHaveBeenCalled();
  });

  it('creates an authoritative Google account with its unique subject', async () => {
    const user: User = buildUser({ type: 'google', email: 'alice@gmail.com' });
    userService.createUser.mockResolvedValue(user);

    const authentication: GoogleAuthentication = await service.signIn({
      idToken: 'token',
    });

    expect(authentication).toEqual({
      session: { user, authVersion: 0 },
      isNewAccount: true,
    });
    expect(userService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        googleSubject: 'google-subject',
        isVerified: true,
        email: 'alice@gmail.com',
      }),
    );
    expect(userService.findByIdentifier).not.toHaveBeenCalled();
  });
});

describe('GoogleAuthService.requestEmail', () => {
  it('requires proof of the former Cityborn address to recover a historical account', async () => {
    const user: User = buildUser({
      email: 'former@example.com',
      type: 'google',
      isVerified: true,
    });
    userService.findGoogleEmailOwner.mockResolvedValue(user);

    await service.requestEmail({
      idToken: 'token',
      accountEmail: 'Former@Example.com',
    });

    expect(userService.findGoogleEmailOwner).toHaveBeenCalledWith(
      'former@example.com',
    );
    expect(proofService.request).toHaveBeenCalledWith({
      subject: 'google-subject',
      email: 'former@example.com',
      name: 'Alice',
      target: { userId: user.id, isVerified: true },
    });
    expect(userService.createUser).not.toHaveBeenCalled();
  });

  it('rejects an unknown historical address with an assistance message', async () => {
    await expect(
      service.requestEmail({
        idToken: 'token',
        accountEmail: 'former@example.com',
      }),
    ).rejects.toMatchObject({
      response: {
        code: ErrorCode.USER_GOOGLE_ACCOUNT_CONFLICT,
        message: expect.stringContaining('assistance'),
      },
    });

    expect(proofService.request).not.toHaveBeenCalled();
    expect(userService.createUser).not.toHaveBeenCalled();
  });

  it('binds proof to the exact stored account address and operation', async () => {
    const user: User = buildUser({
      email: 'Alice@Gmail.com',
      isVerified: true,
    });
    userService.findGoogleEmailOwner.mockResolvedValue(user);

    await service.requestEmail({ idToken: 'token' });

    expect(proofService.request).toHaveBeenCalledWith({
      subject: 'google-subject',
      email: 'Alice@Gmail.com',
      name: 'Alice',
      target: { userId: user.id, isVerified: true },
    });
    expect(userService.associateGoogleAccount).not.toHaveBeenCalled();
  });
});

describe('GoogleAuthService.confirmEmail', () => {
  it('does not create or associate an account for rejected proof', async () => {
    proofService.consume.mockRejectedValue(new Error('invalid proof'));

    await expect(service.confirmEmail(confirmation)).rejects.toThrow(
      'invalid proof',
    );

    expect(userService.createUser).not.toHaveBeenCalled();
    expect(userService.associateGoogleAccount).not.toHaveBeenCalled();
  });

  it.each([true, false])(
    'associates a verified=%s account and disconnects only reclaimed sessions',
    async (isVerified) => {
      const user: User = buildUser({ isVerified: true });
      const proof: GoogleEmailProof = {
        ...identity,
        target: { userId: user.id, isVerified },
      };
      proofService.consume.mockResolvedValue(proof);
      userService.associateGoogleAccount.mockResolvedValue({
        user,
        authVersion: 3,
      });

      const result: GoogleAuthentication =
        await service.confirmEmail(confirmation);

      expect(result.session.authVersion).toBe(3);
      expect(userService.associateGoogleAccount).toHaveBeenCalledWith({
        userId: user.id,
        isVerified,
        subject: 'google-subject',
        email: 'alice@gmail.com',
      });
      expect(socketService.disconnectOlderSessions).toHaveBeenCalledTimes(
        isVerified ? 0 : 1,
      );
    },
  );

  it('creates an external email account only after consuming proof', async () => {
    proofService.consume.mockResolvedValue({
      ...identity,
      email: 'alice@example.com',
      target: null,
    });
    userService.createUser.mockResolvedValue(buildUser({ type: 'google' }));

    const result: GoogleAuthentication =
      await service.confirmEmail(confirmation);

    expect(result.isNewAccount).toBe(true);
    expect(userService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'alice@example.com',
        googleSubject: 'google-subject',
      }),
    );
  });

  it('rejects a creation proof after an account appears at the target address', async () => {
    proofService.consume.mockResolvedValue({ ...identity, target: null });
    userService.findGoogleEmailOwner.mockResolvedValue(buildUser());

    await expect(service.confirmEmail(confirmation)).rejects.toMatchObject({
      response: { code: ErrorCode.USER_GOOGLE_ACCOUNT_CONFLICT },
    });

    expect(userService.createUser).not.toHaveBeenCalled();
    expect(userService.associateGoogleAccount).not.toHaveBeenCalled();
  });
});
