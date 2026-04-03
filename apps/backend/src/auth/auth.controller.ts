import { User } from '@cityborn/types';
import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { VisitorId } from 'src/common/decorators/visitor-id.decorator';
import { PublicUserResponseDto } from 'src/user/dto/public-user.response.dto';
import { CurrentUser } from 'src/user/user.decorator';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth.response.dto';
import { SignInWithAppleDto } from './dto/sign-in-with-apple.dto';
import { SignInWithGoogleDto } from './dto/sign-in-with-google.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { RefreshGuard } from './guards/refresh.guard';
import { AuthGuard } from './guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async signUp(
    @Body() signUpDto: SignUpDto,
    @VisitorId() visitorId?: string,
  ): Promise<AuthResponseDto> {
    return await this.authService.signUp(signUpDto, visitorId);
  }

  @Post('sign-in')
  async signIn(
    @Body() signInDto: SignInDto,
    @VisitorId() visitorId?: string,
  ): Promise<AuthResponseDto> {
    return await this.authService.signIn(signInDto, visitorId);
  }

  @Post('sign-in-with-google')
  async signInWithGoogle(
    @Body() signInWithGoogleDto: SignInWithGoogleDto,
    @VisitorId() visitorId?: string,
  ): Promise<AuthResponseDto> {
    return await this.authService.signInWithGoogle(
      signInWithGoogleDto,
      visitorId,
    );
  }

  @Post('sign-in-with-apple')
  async signInWithApple(
    @Body() signInWithAppleDto: SignInWithAppleDto,
    @VisitorId() visitorId?: string,
  ): Promise<AuthResponseDto> {
    return await this.authService.signInWithApple(
      signInWithAppleDto,
      visitorId,
    );
  }

  @Post('refresh')
  @UseGuards(RefreshGuard)
  async refresh(@Request() req): Promise<AuthResponseDto> {
    const identifier = req.user.username || req.user.email;
    return await this.authService.refresh(identifier);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getProfile(@Request() req): Promise<PublicUserResponseDto> {
    const identifier = req.user.username || req.user.email;
    return await this.authService.getProfile(identifier);
  }

  @Post('delete-user')
  @UseGuards(AuthGuard)
  async deleteUser(@CurrentUser() user?: User): Promise<void> {
    return await this.authService.deleteUser(user);
  }
}
