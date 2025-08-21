import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
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

@Injectable()
export class AuthService {

    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly mailService: MailService,
        @Inject('GOOGLE_CLIENT') private readonly googleClient: OAuth2Client,
    ) { }

    async signUp(dto: SignUpDto): Promise<AuthResponseDto> {
        const { email, username, birthdate, password } = dto;

        // Validate identifiers
        await this.userService.validateIdentifiers(username, email);

        // Hash password
        const hash = await bcrypt.hash(password, 10);

        try {
            const user = await this.userService.createUser({
                email,
                username,
                birthdate,
                password: hash,
            });

            // Send verification email
            const verification_token = await this.userService.createVerificationToken(user);
            await this.mailService.sendVerificationEmail(email, verification_token);

            // Create JWT
            const access_token = await this.generateToken('access', user.id, user.username, user.email);
            const refresh_token = await this.generateToken('refresh', user.id, user.username, user.email);

            return {
                access_token,
                refresh_token,
                user: this.userService.getPublicUser(user)
            }
        } catch (error) {
            this.logger.error(`Error creating user: ${error.message}`)
            throw new InternalServerErrorException('Error creating user');
        }
    }


    async signIn(dto: SignInDto): Promise<AuthResponseDto> {
        const { identifier, password } = dto;

        // Find user
        const user = await this.userService.findByIdentifier(identifier);

        if (!user) throw new UnauthorizedException(`Invalid credentials`);

        // Check if vanilla account
        if (!user.password) throw new UnauthorizedException('No classic account found. Try with a provider (e.g. Google)');

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) throw new UnauthorizedException(`Invalid password`);

        try {
            // Create JWT
            const access_token = await this.generateToken('access', user.id, user.username, user.email);
            const refresh_token = await this.generateToken('refresh', user.id, user.username, user.email);

            return {
                access_token,
                refresh_token,
                user: this.userService.getPublicUser(user)
            }
        } catch (error) {
            this.logger.error(`Error generating tokens: ${error.message}`);
            throw new InternalServerErrorException(`Error generating tokens: ${error.message}`);
        }
    }

    async signInWithGoogle(dto: SignInWithGoogleDto): Promise<AuthResponseDto> {
        const { idToken } = dto;

        const { email, name } = await this.verifyGoogleToken(idToken);

        // Vérifie si l’utilisateur existe déjà
        let user = await this.userService.findByIdentifier(email);

        if (!user) {
            const uniqueUsername = await this.generateUniqueUsername(name);

            user = await this.userService.createUser({
                email,
                username: uniqueUsername,
            });
        }

        try {
            // Create JWT
            const access_token = await this.generateToken('access', user.id, user.username, user.email);
            const refresh_token = await this.generateToken('refresh', user.id, user.username, user.email);

            return {
                access_token,
                refresh_token,
                user: this.userService.getPublicUser(user)
            }
        } catch (error) {
            this.logger.error(`Error generating tokens: ${error.message}`);
            throw new InternalServerErrorException(`Error generating tokens: ${error.message}`);
        }
    }

    async refresh(identifier: string): Promise<AuthResponseDto> {
        const user = await this.userService.findByIdentifier(identifier);
        if (!user) throw new NotFoundException(`User does not exist`);

        try {
            // Create JWT
            const access_token = await this.generateToken('access', user.id, user.username, user.email);
            const refresh_token = await this.generateToken('refresh', user.id, user.username, user.email);

            return {
                access_token,
                refresh_token,
                user: this.userService.getPublicUser(user)
            }
        } catch (error) {
            this.logger.error(`Error generating tokens: ${error.message}`);
            throw new InternalServerErrorException(`Error generating tokens: ${error.message}`);
        }
    }

    async verifyEmail(dto: VerifyEmailDto): Promise<void> {
        const { verification_token } = dto;
        return await this.userService.verifyEmail(verification_token);
    }

    async getProfile(identifier: string): Promise<PublicUserResponseDto> {
        const user = await this.userService.findByIdentifier(identifier);
        if (!user) throw new UnauthorizedException(`User not found`);

        return {
            user: this.userService.getPublicUser(user)
        }
    }

    // Auxiliary
    private async generateToken(type: 'access' | 'refresh', sub: number, username: string, email: string): Promise<string> {
        const payload = {
            sub,
            username,
            email
        }

        switch (type) {
            case 'access':
                return await this.jwtService.signAsync(payload, {
                    secret: getJwtConstants(this.configService).jwt_access_secret,
                    expiresIn: '15m'
                });

            case 'refresh':
                return await this.jwtService.signAsync(payload, {
                    secret: getJwtConstants(this.configService).jwt_refresh_secret,
                    expiresIn: '7d'
                });
        }
    }

    private async verifyGoogleToken(idToken: string) {
        const ticket = await this.googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
            throw new UnauthorizedException('Invalid Google token');
        }

        if (!payload.email || !payload.name) throw new BadRequestException('Missing name or email');
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

            exists = await this.userService.findByIdentifier(username) ? true : false;
        }

        return username;
    }
}
