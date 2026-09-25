import {
  type AuthResponse,
  type CreateUser,
  ErrorCode,
  type PublicUser,
  type SignIn,
  type SignInWithApple,
  type SignInWithGoogle,
  type UpdatePassword,
  type UpdateUsername,
  type User,
  UserIdSchema,
  type Username,
  UsernameSchema,
  VerifyEmailData,
} from '@cityborn/api';
import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { WideEventService } from '../common/wide-event/wide-event.service';
import {
  AUTH_CONFIG,
  type AuthConfig,
  HTTP_CONFIG,
  type HttpConfig,
} from '../config/config.module';
import { EventService } from '../event/event.service';
import { createEvent } from '../event/event.types';
import { buildMailOptions } from '../mail/email-templates';
import { MailService } from '../mail/mail.service';
import { UserService } from '../user/user.service';
import { verifyAppleIdToken } from './utils';

const verificationEmailCooldown = 3 * 60 * 1000;
interface GoogleIdentityPayload {
  email_verified?: boolean;
  email?: string;
  name?: string;
}

interface GoogleIdentityTicket {
  getPayload(): GoogleIdentityPayload | undefined;
}

export interface GoogleIdentityClient {
  verifyIdToken(options: {
    idToken: string;
    audience?: string;
  }): Promise<GoogleIdentityTicket>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(AUTH_CONFIG) private readonly authConfig: AuthConfig,
    @Inject(HTTP_CONFIG) private readonly httpConfig: HttpConfig,
    private readonly eventService: EventService,
    private readonly mailService: MailService,
    private readonly wideEventService: WideEventService,
    @Inject('GOOGLE_CLIENT')
    private readonly googleClient: GoogleIdentityClient,
  ) {}

  async signUp(dto: CreateUser, visitorId?: string): Promise<AuthResponse> {
    const { email, username, password } = dto;

    await this.userService.validateIdentifiers(username, email);

    const hash = await bcrypt.hash(password, 10);

    const user = await this.userService.createUser({
      email,
      username,
      type: 'email',
      password: hash,
    });
    if (!user)
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: `Error creating user in database`,
      });

    void this.sendVerificationEmail(user).catch((error: unknown) => {
      this.wideEventService.recordOperationError(error, {
        domain: 'auth',
        operation: 'send_verification_email',
        userId: user.id,
      });
    });

    if (visitorId) {
      await this.eventService.trackEvent(
        createEvent({
          name: 'user_signed_up',
          visitorId,
          properties: {
            method: 'email',
          },
        }),
      );
    }

    return this.generateAuthResponse(user);
  }

  async signIn(dto: SignIn, visitorId?: string): Promise<AuthResponse> {
    const { identifier, password } = dto;

    const credentials =
      await this.userService.findCredentialsByIdentifier(identifier);
    if (!credentials?.passwordHash)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: `Invalid credentials`,
      });

    const isPasswordValid = await bcrypt.compare(
      password,
      credentials.passwordHash,
    );
    if (!isPasswordValid)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: `Invalid credentials`,
      });

    const { user, authVersion } = credentials;

    if (visitorId) {
      await this.eventService.trackEvent(
        createEvent({
          name: 'user_signed_in',
          visitorId,
          properties: {
            method: 'email',
          },
        }),
      );
    }

    return this.generateAuthResponse(user, authVersion);
  }

  async signInWithGoogle(
    dto: SignInWithGoogle,
    visitorId?: string,
  ): Promise<AuthResponse> {
    const { idToken } = dto;

    const { email, name } = await this.verifyGoogleToken(idToken);

    let user = await this.userService.findByIdentifier(email);

    if (!user) {
      const uniqueUsername = await this.generateUniqueUsername(name);

      user = await this.userService.createUser({
        email,
        username: uniqueUsername,
        type: 'google',
        isVerified: true,
      });

      if (visitorId) {
        await this.eventService.trackEvent(
          createEvent({
            name: 'user_signed_up',
            visitorId,
            properties: {
              method: 'google',
            },
          }),
        );
      }
    } else {
      if (visitorId) {
        await this.eventService.trackEvent(
          createEvent({
            name: 'user_signed_in',
            visitorId,
            properties: {
              method: 'google',
            },
          }),
        );
      }
    }

    return this.generateAuthResponse(user);
  }

  async signInWithApple(
    dto: SignInWithApple,
    visitorId?: string,
  ): Promise<AuthResponse> {
    const { identity_token, apple_user_id, details } = dto;

    if (
      !(await verifyAppleIdToken(identity_token, this.authConfig.appleAppId))
    ) {
      throw new UnauthorizedException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Bad request',
      });
    }

    let user = await this.userService.findByAppleId(apple_user_id);

    if (!user) {
      if (!details) {
        throw new UnauthorizedException({
          code: ErrorCode.USER_INVALID_CREDENTIALS,
          message: `Invalid credentials`,
        });
      }

      user = await this.userService.findByIdentifier(details.email);
      if (!user) {
        const uniqueUsername = await this.generateUniqueUsername(
          `${details.given_name}${details.family_name}`,
        );

        user = await this.userService.createUser({
          email: details.email,
          username: uniqueUsername,
          type: 'apple',
          appleId: apple_user_id,
          isVerified: true,
        });

        if (visitorId) {
          await this.eventService.trackEvent(
            createEvent({
              name: 'user_signed_up',
              visitorId,
              properties: {
                method: 'apple',
              },
            }),
          );
        }
      }
    } else {
      if (visitorId) {
        await this.eventService.trackEvent(
          createEvent({
            name: 'user_signed_in',
            visitorId,
            properties: {
              method: 'apple',
            },
          }),
        );
      }
    }

    return this.generateAuthResponse(user);
  }

  async refresh(
    identifier: string,
    authVersion: number,
  ): Promise<AuthResponse> {
    const user = await this.userService.findByIdentifier(identifier);
    if (!user)
      throw new UnauthorizedException({
        code: ErrorCode.USER_REFRESH_FAILED,
        message: 'Invalid refresh token',
      });

    return this.generateAuthResponse(user, authVersion);
  }

  async getProfile(identifier: string): Promise<User> {
    const user = await this.userService.findByIdentifier(identifier);
    if (!user)
      throw new NotFoundException({
        code: ErrorCode.USER_NOT_FOUND,
        message: `User not found`,
      });

    return user;
  }

  async deleteUser(user?: User): Promise<void> {
    if (!user)
      throw new NotFoundException({
        code: ErrorCode.USER_NOT_FOUND,
        message: `User not found`,
      });
    await this.userService.deleteUser(user.id);
  }

  async updateUsername(user: User, data: UpdateUsername): Promise<User> {
    return this.userService.updateUsername(user, data.username);
  }

  async updatePassword(
    user: User,
    data: UpdatePassword,
  ): Promise<AuthResponse> {
    if (user.type !== 'email') {
      throw new ForbiddenException({
        code: ErrorCode.USER_NOT_VANILLA_ACCOUNT,
        message: 'Password update is only available for email accounts',
      });
    }

    const credentials = await this.userService.findCredentialsById(user.id);
    if (!credentials?.passwordHash) {
      throw new ForbiddenException({
        code: ErrorCode.USER_NOT_VANILLA_ACCOUNT,
        message: 'Password update is only available for email accounts',
      });
    }

    const isCurrentPasswordValid: boolean = await bcrypt.compare(
      data.currentPassword,
      credentials.passwordHash,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException({
        code: ErrorCode.USER_CURRENT_PASSWORD_INCORRECT,
        message: 'Current password is incorrect',
      });
    }

    const passwordHash: string = await bcrypt.hash(data.newPassword, 10);
    const authenticationState = await this.userService.updatePassword(
      user.id,
      passwordHash,
    );

    return this.generateAuthResponse(
      authenticationState.user,
      authenticationState.authVersion,
    );
  }

  async resendVerificationEmail(user: User): Promise<void> {
    if (user.isVerified) return;
    await this.sendVerificationEmail(user, verificationEmailCooldown);
  }

  async verifyEmail(verifyEmailData: VerifyEmailData): Promise<PublicUser> {
    const user = await this.userService.verifyEmail(
      verifyEmailData.verification_token,
    );

    return { id: user.id, username: user.username };
  }

  private async sendVerificationEmail(
    user: {
      id: string;
      email: string;
      username: string;
    },
    resendCooldownMs?: number,
  ): Promise<void> {
    const verificationToken =
      await this.userService.createEmailVerificationToken(
        UserIdSchema.parse(user.id),
        resendCooldownMs,
      );
    await this.mailService.sendMail(
      buildMailOptions('verification-email', {
        email: user.email,
        frontendUrl: this.httpConfig.frontendUrl,
        verificationToken,
        username: user.username,
      }),
    );
  }

  private async generateAuthResponse(
    user: User,
    authVersion: number = 0,
  ): Promise<AuthResponse> {
    const accessToken: string = await this.generateToken(
      'access',
      user,
      authVersion,
    );
    const refreshToken: string = await this.generateToken(
      'refresh',
      user,
      authVersion,
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user,
    };
  }

  private async generateToken(
    type: 'access' | 'refresh',
    user: User,
    authVersion: number,
  ): Promise<string> {
    const payload = {
      id: UserIdSchema.parse(user.id),
      username: UsernameSchema.parse(user.username),
      email: user.email,
      authVersion,
    };

    switch (type) {
      case 'access':
        return await this.jwtService.signAsync(payload, {
          secret: this.authConfig.jwtAccessSecret,
          expiresIn: '15m',
        });

      case 'refresh':
        return await this.jwtService.signAsync(payload, {
          secret: this.authConfig.jwtRefreshSecret,
          expiresIn: '7d',
        });
    }
  }

  private async verifyGoogleToken(idToken: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: this.authConfig.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: 'Invalid credentials',
      });

    if (!payload.email_verified)
      throw new UnauthorizedException({
        code: ErrorCode.USER_GOOGLE_EMAIL_NOT_VERIFIED,
        message: 'Google account not verified',
      });

    if (!payload.email || !payload.name)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: 'Missing name or email',
      });

    return {
      email: payload.email,
      name: payload.name,
    };
  }

  private async generateUniqueUsername(base: string): Promise<Username> {
    const sanitized = base.replace(/\s+/g, '').toLowerCase();

    let username: string = sanitized;
    let exists = true;

    while (exists) {
      const suffix = Math.floor(1000 + Math.random() * 9000);
      username = `${sanitized}${suffix}`;

      exists = await this.userService.existsByUsername(username);
    }

    return UsernameSchema.parse(username);
  }
}
