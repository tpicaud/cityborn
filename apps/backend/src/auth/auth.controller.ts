import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { AuthResponseDto } from './dto/auth.response.dto';

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
}
