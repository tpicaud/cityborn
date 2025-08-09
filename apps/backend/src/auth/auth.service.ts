import { Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import * as bcrypt from 'bcrypt';
import { SignInDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { AuthResponseDto } from './dto/auth.response.dto';

@Injectable()
export class AuthService {

    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService
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

    // Auxiliary
    private async generateJWT(sub: number, username: string, email: string): Promise<string> {
        const payload = {
            sub,
            username,
            email
        }
        return await this.jwtService.signAsync(payload);
    }
}
