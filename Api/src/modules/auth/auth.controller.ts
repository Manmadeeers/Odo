import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import type {
  AuthenticationResult,
  EmailConfirmationResult,
  ForgotPasswordResult,
  ResetPasswordResult,
} from './auth.types.js';
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

  @Post('confirm-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  confirmEmail(
    @Body({ schema: confirmEmailSchema }) input: ConfirmEmailDto,
  ): Promise<EmailConfirmationResult> {
    return this.authService.confirmEmail(input.token);
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
