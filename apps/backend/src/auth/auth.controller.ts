import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { AuthResponseDto } from './dto/auth.response.dto';
import { PublicUserResponseDto } from 'src/user/dto/public-user.response.dto';
import { SignInWithGoogleDto } from './dto/sign-in-with-google.dto';
import { RefreshGuard } from './guards/refresh.guard';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { CurrentUser } from 'src/user/user.decorator';
import { NotVerifiedAuthGuard } from './guards/auth-not-verified.guard';
import { User } from '@cityborn/types';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('sign-up')
    async signUp(@Body() signUpDto: SignUpDto): Promise<AuthResponseDto> {
        return await this.authService.signUp(signUpDto);
    }

    @Post('sign-in')
    async signIn(@Body() signInDto: SignInDto): Promise<AuthResponseDto> {
        return await this.authService.signIn(signInDto);
    }

    @Post('sign-in-with-google')
    async signInWithGoogle(@Body() signInWithGoogleDto: SignInWithGoogleDto): Promise<AuthResponseDto> {
        return await this.authService.signInWithGoogle(signInWithGoogleDto);
    }

    @Post('refresh')
    @UseGuards(RefreshGuard)
    async refresh(@Request() req): Promise<AuthResponseDto> {
        const identifier = req.user.username || req.user.email;
        return await this.authService.refresh(identifier);
    }

    @Post('send-verification-email')
    @UseGuards(NotVerifiedAuthGuard)
    async sendVerificationEmail(@CurrentUser() user?: User): Promise<void> {
        return await this.authService.sendVerificationEmail(user);
    }

    @Post('verify-email')
    async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<void> {
        return await this.authService.verifyEmail(verifyEmailDto);
    }

    @Get('me')
    @UseGuards(NotVerifiedAuthGuard)
    async getProfile(@Request() req): Promise<PublicUserResponseDto> {
        const identifier = req.user.username || req.user.email;
        return await this.authService.getProfile(identifier);
    }

}
