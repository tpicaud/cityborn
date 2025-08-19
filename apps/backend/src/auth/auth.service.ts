import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import * as bcrypt from 'bcrypt';
import { SignInDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { AuthResponseDto } from './dto/auth.response.dto';
import { PublicUserResponseDto } from 'src/user/dto/public-user.response.dto';
import { OAuth2Client } from 'google-auth-library';
import { SignInWithGoogleDto } from './dto/sign-in-with-google.dto';

@Injectable()
export class AuthService {

    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        @Inject('GOOGLE_CLIENT') private readonly googleClient: OAuth2Client,
    ) { }

    async signUp(dto: SignUpDto): Promise<AuthResponseDto> {
        const { email, username, password } = dto;

        // Validate identifiers
        await this.userService.validateIdentifiers(username, email);

        // Hash password
        const hash = await bcrypt.hash(password, 10);

        try {
            const user = await this.userService.createUser({
                email,
                username,
                password: hash,
            });

            // Create JWT
            const token = await this.generateJWT(user.id, user.username, user.email);

            return {
                access_token: token,
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

        // Create JWT
        try {
            const token = await this.generateJWT(user.id, user.username, user.email);

            return {
                access_token: token,
                user: this.userService.getPublicUser(user)
            }
        } catch (error) {
            this.logger.error(`Error generating token: ${error.message}`);
            throw new InternalServerErrorException(`Error generating token: ${error.message}`);
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
                password: null
            });
        }

        // Génére ton JWT habituel
        const token = await this.generateJWT(user.id, user.username, user.email);

        return {
            access_token: token,
            user: this.userService.getPublicUser(user),
        };
    }


    async getProfile(identifier: string): Promise<PublicUserResponseDto> {
        const user = await this.userService.findByIdentifier(identifier);
        if (!user) throw new UnauthorizedException(`User not found`);

        return {
            user: this.userService.getPublicUser(user)
        }
    }

    // Auxiliary
    private async generateJWT(sub: number, username: string, email: string): Promise<string> {
        const payload = {
            sub,
            username,
            email
        }
        return await this.jwtService.signAsync(payload);
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
