import { Body, Controller, Get, Post, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { AuthResponseDto } from './dto/auth.response.dto';
import { AuthGuard } from './auth.guard';
import { PublicUserResponseDto } from 'src/user/dto/public-user.response.dto';

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

    @Get('me')
    @UseGuards(AuthGuard)
    async getProfile(@Request() req): Promise<PublicUserResponseDto> {
        const identifier = req.user.username || req.user.email;
        return await this.authService.getProfile(identifier);
    }

}
