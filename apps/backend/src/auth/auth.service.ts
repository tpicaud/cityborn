import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import * as bcrypt from 'bcrypt';
import { SignInDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { AuthResponseDto } from './dto/auth.response.dto';
import { PublicUserResponseDto } from 'src/user/dto/public-user.response.dto';
import { OAuth2Client } from 'google-auth-library';
import { SignInWithGoogleDto } from './dto/sign-in-with-google.dto';
import { getJwtConstants } from './constants';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ErrorCode } from '@cityborn/errors';
import { createEvent, User } from '@cityborn/types';
import { UserMapper } from 'src/user/user.mapper';
import { EventService } from 'src/event/event.service';
import { SignInWithAppleDto } from './dto/sign-in-with-apple.dto';
import { verifyAppleIdToken } from './utils';
import { DeleteUserDto } from 'src/user/dto/delete-user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly eventService: EventService,
    @Inject('GOOGLE_CLIENT') private readonly googleClient: OAuth2Client,
  ) {}

  async signUp(dto: SignUpDto, visitorId?: string): Promise<AuthResponseDto> {
    const { email, username, birthdate, password } = dto;

    // Validate identifiers
    await this.userService.validateIdentifiers(username, email);

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    const user = await this.userService.createUser({
      email,
      username,
      type: 'email',
      birthdate,
      password: hash,
    });
    if (!user)
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: `Error creating user in database`,
      });

    // Send verification email
    const verification_token =
      await this.userService.createVerificationToken(user);
    await this.mailService.sendVerificationEmail(email, verification_token);

    // Create JWT
    const access_token = await this.generateToken(
      'access',
      user.id,
      user.username,
      user.email,
      user.isVerified,
    );
    const refresh_token = await this.generateToken(
      'refresh',
      user.id,
      user.username,
      user.email,
      user.isVerified,
    );

    // Send event
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
      user: UserMapper.toUserDto(user),
    };
  }

  async signIn(dto: SignInDto, visitorId?: string): Promise<AuthResponseDto> {
    const { identifier, password } = dto;

    // Find user
    const user = await this.userService.findByIdentifier(identifier);
    if (!user)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: `Invalid credentials`,
      });

    // Check if vanilla account
    if (!user.password)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: `Invalid credentials`,
      });

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: `Invalid credentials`,
      });

    // Create JWT
    const access_token = await this.generateToken(
      'access',
      user.id,
      user.username,
      user.email,
      user.isVerified,
    );
    const refresh_token = await this.generateToken(
      'refresh',
      user.id,
      user.username,
      user.email,
      user.isVerified,
    );

    // Send event
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
      user: UserMapper.toUserDto(user),
    };
  }

  async signInWithGoogle(
    dto: SignInWithGoogleDto,
    visitorId?: string,
  ): Promise<AuthResponseDto> {
    const { idToken } = dto;

    const { email, name } = await this.verifyGoogleToken(idToken);

    // Vérifie si l’utilisateur existe déjà
    let user = await this.userService.findByIdentifier(email);

    if (!user) {
      const uniqueUsername = await this.generateUniqueUsername(name);

      user = await this.userService.createUser({
        email,
        username: uniqueUsername,
        type: 'google',
        isVerified: true,
      });

      // Send event
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
      // Send event
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
      user.isVerified,
    );
    const refresh_token = await this.generateToken(
      'refresh',
      user.id,
      user.username,
      user.email,
      user.isVerified,
    );

    return {
      access_token,
      refresh_token,
      user: UserMapper.toUserDto(user),
    };
  }

  async signInWithApple(dto: SignInWithAppleDto, visitorId?: string) {
    const { identity_token, apple_user_id, details } = dto;

    if (!(await verifyAppleIdToken(identity_token, process.env.APP_ID!))) {
      throw new UnauthorizedException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Bad request',
      });
    }

    // Vérifie si l’utilisateur existe déjà
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

        // Send event
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
      // Send event
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
      user.isVerified,
    );
    const refresh_token = await this.generateToken(
      'refresh',
      user.id,
      user.username,
      user.email,
      user.isVerified,
    );

    return {
      access_token,
      refresh_token,
      user: UserMapper.toUserDto(user),
    };
  }

  async refresh(identifier: string): Promise<AuthResponseDto> {
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
      user.isVerified,
    );
    const refresh_token = await this.generateToken(
      'refresh',
      user.id,
      user.username,
      user.email,
      user.isVerified,
    );

    return {
      access_token,
      refresh_token,
      user: UserMapper.toUserDto(user),
    };
  }

  async sendVerificationEmail(currentUser: any): Promise<void> {
    try {
      const user = await this.userService.findByIdentifier(currentUser.email);
      if (!user) return; // no error for security

      // Send verification email
      const verification_token =
        await this.userService.createVerificationToken(user);
      await this.mailService.sendVerificationEmail(
        user.email,
        verification_token,
      );
    } catch {
      return; // no error for security
    }
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<void> {
    const { verification_token } = dto;
    return await this.userService.verifyEmail(verification_token);
  }

  async getProfile(identifier: string): Promise<PublicUserResponseDto> {
    const user = await this.userService.findByIdentifier(identifier);
    if (!user)
      throw new NotFoundException({
        code: ErrorCode.USER_NOT_FOUND,
        message: `User not found`,
      });

    return {
      user: UserMapper.toUserDto(user),
    };
  }

  async deleteUser(user?: User): Promise<void> {
    if (!user)
      throw new NotFoundException({
        code: ErrorCode.USER_NOT_FOUND,
        message: `User not found`,
      });
    await this.userService.deleteUser(user.id);
  }

  // Auxiliary
  private async generateToken(
    type: 'access' | 'refresh',
    id: string,
    username: string,
    email: string,
    isVerified: boolean,
  ): Promise<string> {
    const payload = {
      id,
      username,
      email,
      isVerified,
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
      const suffix = Math.floor(1000 + Math.random() * 9000); // 4 chiffres
      username = `${sanitized}${suffix}`;

      exists = (await this.userService.findByIdentifier(username))
        ? true
        : false;
    }

    return username;
  }
}
