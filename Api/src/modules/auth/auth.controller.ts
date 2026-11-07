import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AccessTokenGuard } from './access-token.guard.js';
import { AuthService } from './auth.service.js';
import type {
  AuthenticationResult,
  AuthenticatedRequestUser,
  EmailConfirmationResult,
  ForgotPasswordResult,
  LogoutResult,
  RefreshTokenResult,
  ResendVerificationEmailResult,
  ResetPasswordResult,
} from './auth.types.js';
import { CurrentUser } from './current-user.decorator.js';
import {
  confirmEmailSchema,
  type ConfirmEmailDto,
} from './dto/confirm-email.dto.js';
import { loginSchema, type LoginDto } from './dto/login.dto.js';
import {
  forgotPasswordSchema,
  type ForgotPasswordDto,
} from './dto/forgot-password.dto.js';
import { registerSchema, type RegisterDto } from './dto/register.dto.js';
import {
  refreshTokenSchema,
  type RefreshTokenDto,
} from './dto/refresh-token.dto.js';
import {
  resendVerificationEmailSchema,
  type ResendVerificationEmailDto,
} from './dto/resend-verification-email.dto.js';
import {
  resetPasswordSchema,
  type ResetPasswordDto,
} from './dto/reset-password.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(
    @Body({ schema: registerSchema }) input: RegisterDto,
  ): Promise<AuthenticationResult> {
    return this.authService.register(input);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(
    @Body({ schema: loginSchema }) input: LoginDto,
  ): Promise<AuthenticationResult> {
    return this.authService.login(input);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  refreshToken(
    @Body({ schema: refreshTokenSchema }) input: RefreshTokenDto,
  ): Promise<RefreshTokenResult> {
    return this.authService.refreshToken(input.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  logout(@CurrentUser() user: AuthenticatedRequestUser): Promise<LogoutResult> {
    return this.authService.logout(user.sessionId, user.id);
  }

  @Post('confirm-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  confirmEmail(
    @Body({ schema: confirmEmailSchema }) input: ConfirmEmailDto,
  ): Promise<EmailConfirmationResult> {
    return this.authService.confirmEmail(input.token);
  }

  @Post('resend-verification-email')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  resendVerificationEmail(
    @Body({ schema: resendVerificationEmailSchema })
    input: ResendVerificationEmailDto,
  ): Promise<ResendVerificationEmailResult> {
    return this.authService.resendVerificationEmail(input.email);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  forgotPassword(
    @Body({ schema: forgotPasswordSchema }) input: ForgotPasswordDto,
  ): Promise<ForgotPasswordResult> {
    return this.authService.forgotPassword(input.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  resetPassword(
    @Body({ schema: resetPasswordSchema }) input: ResetPasswordDto,
  ): Promise<ResetPasswordResult> {
    return this.authService.resetPassword(input.token, input.newPassword);
  }
}
