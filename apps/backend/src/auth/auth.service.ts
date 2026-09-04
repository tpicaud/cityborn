import {
  type AuthResponse,
  type CreateUser,
  ErrorCode,
  PublicUser,
  type SignIn,
  type SignInWithApple,
  type SignInWithGoogle,
  type User,
  VerifyEmailData,
} from '@cityborn/api';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { EventService } from '../event/event.service';
import { createEvent } from '../event/event.types';
import { buildMailOptions } from '../mail/email-templates';
import { MailService } from '../mail/mail.service';
import { UserMapper } from '../user/user.mapper';
import { UserService } from '../user/user.service';
import { getJwtConstants } from './constants';
import { verifyAppleIdToken } from './utils';

const verificationEmailCooldown = 3 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventService: EventService,
    private readonly mailService: MailService,
    @Inject('GOOGLE_CLIENT') private readonly googleClient: OAuth2Client,
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

    await this.sendVerificationEmail(user);

    const access_token = await this.generateToken(
      'access',
      user.id,
      user.username,
      user.email,
    );
    const refresh_token = await this.generateToken(
      'refresh',
      user.id,
      user.username,
      user.email,
    );

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

    return {
      access_token,
      refresh_token,
      user: UserMapper.toUser(user),
    };
  }

  async signIn(dto: SignIn, visitorId?: string): Promise<AuthResponse> {
    const { identifier, password } = dto;

    const user = await this.userService.findByIdentifier(identifier);
    if (!user)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: `Invalid credentials`,
      });

    if (!user.password)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: `Invalid credentials`,
      });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: `Invalid credentials`,
      });

    const access_token = await this.generateToken(
      'access',
      user.id,
      user.username,
      user.email,
    );
    const refresh_token = await this.generateToken(
      'refresh',
      user.id,
      user.username,
      user.email,
    );

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

    return {
      access_token,
      refresh_token,
      user: UserMapper.toUser(user),
    };
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

    const access_token = await this.generateToken(
      'access',
      user.id,
      user.username,
      user.email,
    );
    const refresh_token = await this.generateToken(
      'refresh',
      user.id,
      user.username,
      user.email,
    );

    return {
      access_token,
      refresh_token,
      user: UserMapper.toUser(user),
    };
  }

  async signInWithApple(
    dto: SignInWithApple,
    visitorId?: string,
  ): Promise<AuthResponse> {
    const { identity_token, apple_user_id, details } = dto;

    const appId = process.env.APP_ID;
    if (!appId || !(await verifyAppleIdToken(identity_token, appId))) {
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

    const access_token = await this.generateToken(
      'access',
      user.id,
      user.username,
      user.email,
    );
    const refresh_token = await this.generateToken(
      'refresh',
      user.id,
      user.username,
      user.email,
    );

    return {
      access_token,
      refresh_token,
      user: UserMapper.toUser(user),
    };
  }

  async refresh(identifier: string): Promise<AuthResponse> {
    const user = await this.userService.findByIdentifier(identifier);
    if (!user)
      throw new UnauthorizedException({
        code: ErrorCode.USER_REFRESH_FAILED,
        message: 'Invalid refresh token',
      });

    const access_token = await this.generateToken(
      'access',
      user.id,
      user.username,
      user.email,
    );
    const refresh_token = await this.generateToken(
      'refresh',
      user.id,
      user.username,
      user.email,
    );

    return {
      access_token,
      refresh_token,
      user: UserMapper.toUser(user),
    };
  }

  async getProfile(identifier: string): Promise<User> {
    const user = await this.userService.findByIdentifier(identifier);
    if (!user)
      throw new NotFoundException({
        code: ErrorCode.USER_NOT_FOUND,
        message: `User not found`,
      });

    return UserMapper.toUser(user);
  }

  async deleteUser(user?: User): Promise<void> {
    if (!user)
      throw new NotFoundException({
        code: ErrorCode.USER_NOT_FOUND,
        message: `User not found`,
      });
    await this.userService.deleteUser(user.id);
  }

  async resendVerificationEmail(user: User): Promise<void> {
    if (user.isVerified) return;
    await this.sendVerificationEmail(user, verificationEmailCooldown);
  }

  async verifyEmail(verifyEmailData: VerifyEmailData): Promise<PublicUser> {
    const user = await this.userService.verifyEmail(
      verifyEmailData.verification_token,
    );

    return UserMapper.toPublicUser(user);
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
        user.id,
        resendCooldownMs,
      );
    await this.mailService.sendMail(
      buildMailOptions('verification-email', {
        email: user.email,
        frontendUrl:
          this.configService.get<string>('FRONTEND_URL') ??
          'http://localhost:3000',
        verificationToken,
        username: user.username,
      }),
    );
  }

  private async generateToken(
    type: 'access' | 'refresh',
    id: string,
    username: string,
    email: string,
  ): Promise<string> {
    const payload = {
      id,
      username,
      email,
    };

    switch (type) {
      case 'access':
        return await this.jwtService.signAsync(payload, {
          secret: getJwtConstants(this.configService).jwt_access_secret,
          expiresIn: '15m',
        });

      case 'refresh':
        return await this.jwtService.signAsync(payload, {
          secret: getJwtConstants(this.configService).jwt_refresh_secret,
          expiresIn: '7d',
        });
    }
  }

  private async verifyGoogleToken(idToken: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
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

  private async generateUniqueUsername(base: string): Promise<string> {
    const sanitized = base.replace(/\s+/g, '').toLowerCase();

    let username: string = sanitized;
    let exists = true;

    while (exists) {
      const suffix = Math.floor(1000 + Math.random() * 9000);
      username = `${sanitized}${suffix}`;

      exists = !!(await this.userService.findByIdentifier(username));
    }

    return username;
  }
}
