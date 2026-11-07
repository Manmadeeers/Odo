import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PasswordHasher } from '@nestjs/authentication';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  IsNull,
  Not,
  QueryFailedError,
  type EntityManager,
  type Repository,
} from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { MailService } from '../mail/mail.service.js';
import type {
  AuthenticationResult,
  ChangePasswordResult,
  EmailConfirmationResult,
  ForgotPasswordResult,
  LogoutResult,
  RegistrationResult,
  RefreshTokenResult,
  ResendVerificationEmailResult,
  ResetPasswordResult,
} from './auth.types.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import { AuthSession } from './entities/auth-session.entity.js';
import { EmailVerificationToken } from './entities/email-verification-token.entity.js';
import { PasswordResetToken } from './entities/password-reset-token.entity.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessTokenTtlSeconds: number;
  private readonly refreshTokenTtlMilliseconds: number;
  private readonly emailVerificationTtlMilliseconds: number;
  private readonly emailVerificationUrl: string;
  private readonly passwordResetTtlMilliseconds: number;
  private readonly passwordResetUrl: string;

  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(AuthSession)
    private readonly sessionsRepository: Repository<AuthSession>,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly passwordHasher: PasswordHasher,
    private readonly mailService: MailService,
    configService: ConfigService,
  ) {
    this.accessTokenTtlSeconds = configService.getOrThrow<number>(
      'JWT_ACCESS_TTL_SECONDS',
    );
    this.refreshTokenTtlMilliseconds =
      configService.getOrThrow<number>('JWT_REFRESH_TTL_DAYS') *
      24 *
      60 *
      60 *
      1000;
    this.emailVerificationTtlMilliseconds =
      configService.getOrThrow<number>('EMAIL_VERIFICATION_TTL_HOURS') *
      60 *
      60 *
      1000;
    this.emailVerificationUrl = configService.getOrThrow<string>(
      'EMAIL_VERIFICATION_URL',
    );
    this.passwordResetTtlMilliseconds =
      configService.getOrThrow<number>('PASSWORD_RESET_TTL_MINUTES') *
      60 *
      1000;
    this.passwordResetUrl =
      configService.getOrThrow<string>('PASSWORD_RESET_URL');
  }

  async register(input: RegisterDto): Promise<RegistrationResult> {
    const passwordHash = await this.passwordHasher.hash(input.password);

    try {
      const { user, verificationToken } = await this.dataSource.transaction(
        async (manager) => {
          const user = await this.usersService.create(
            input.email,
            passwordHash,
            manager,
          );
          const verificationToken = await this.replaceEmailVerificationToken(
            user.id,
            manager,
          );
          return { user, verificationToken };
        },
      );

      await this.sendVerificationEmail(user.email, verificationToken);

      return {
        user: {
          id: user.id,
          email: user.email,
          emailVerified: false,
        },
        message:
          'Registration successful. Check your email to verify your account',
      };
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
      throw error;
    }
  }

  async confirmEmail(token: string): Promise<EmailConfirmationResult> {
    const tokenHash = this.hashToken(token);

    await this.dataSource.transaction(async (manager) => {
      const verification = await manager
        .getRepository(EmailVerificationToken)
        .createQueryBuilder('verification')
        .setLock('pessimistic_write')
        .where('verification.tokenHash = :tokenHash', { tokenHash })
        .getOne();

      if (!verification) {
        throw new BadRequestException(
          'Invalid or expired email verification token',
        );
      }

      if (verification.consumedAt) {
        return;
      }

      if (verification.expiresAt.getTime() <= Date.now()) {
        throw new BadRequestException(
          'Invalid or expired email verification token',
        );
      }

      const confirmedAt = new Date();
      await manager
        .getRepository(User)
        .update({ id: verification.userId }, { emailVerifiedAt: confirmedAt });
      await manager
        .getRepository(EmailVerificationToken)
        .update({ id: verification.id }, { consumedAt: confirmedAt });
    });

    return { message: 'Email confirmed' };
  }

  async login(input: LoginDto): Promise<AuthenticationResult> {
    const user = await this.usersService.findByEmailForAuthentication(
      input.email,
    );
    const passwordMatches = await this.passwordHasher.verify(
      input.password,
      user?.passwordHash,
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException('Email address is not verified');
    }

    if (this.passwordHasher.needsRehash(user.passwordHash)) {
      await this.usersService.updatePasswordHash(
        user.id,
        await this.passwordHasher.hash(input.password),
      );
    }

    return this.issueTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResult> {
    const refreshTokenHash = this.hashToken(refreshToken);

    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(AuthSession);
      const session = await repository
        .createQueryBuilder('session')
        .innerJoinAndSelect('session.user', 'user')
        .setLock('pessimistic_write')
        .where('session.refreshTokenHash = :refreshTokenHash', {
          refreshTokenHash,
        })
        .getOne();

      if (
        !session ||
        session.revokedAt ||
        session.expiresAt.getTime() <= Date.now()
      ) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      if (!session.user.emailVerifiedAt) {
        throw new ForbiddenException('Email address is not verified');
      }

      const rotatedRefreshToken = randomBytes(32).toString('base64url');
      await repository.update(
        { id: session.id },
        {
          refreshTokenHash: this.hashToken(rotatedRefreshToken),
          expiresAt: new Date(Date.now() + this.refreshTokenTtlMilliseconds),
        },
      );

      return this.createAuthenticationResult(
        session.user,
        session.id,
        rotatedRefreshToken,
      );
    });
  }

  async logout(sessionId: string, userId: string): Promise<LogoutResult> {
    await this.sessionsRepository.update(
      { id: sessionId, userId },
      { revokedAt: new Date() },
    );

    return { message: 'Logged out' };
  }

  async changePassword(
    userId: string,
    currentSessionId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<ChangePasswordResult> {
    const newPasswordHash = await this.passwordHasher.hash(newPassword);

    await this.dataSource.transaction(async (manager) => {
      const user = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .addSelect('user.passwordHash')
        .setLock('pessimistic_write')
        .where('user.id = :userId', { userId })
        .getOneOrFail();
      const passwordMatches = await this.passwordHasher.verify(
        currentPassword,
        user.passwordHash,
      );

      if (!passwordMatches) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      await manager
        .getRepository(User)
        .update({ id: userId }, { passwordHash: newPasswordHash });
      await manager.getRepository(AuthSession).update(
        {
          userId,
          id: Not(currentSessionId),
          revokedAt: IsNull(),
        },
        { revokedAt: new Date() },
      );
    });

    return { message: 'Password changed successfully' };
  }

  async resendVerificationEmail(
    email: string,
  ): Promise<ResendVerificationEmailResult> {
    const response: ResendVerificationEmailResult = {
      message:
        'If an unverified account exists for that email, a verification link has been sent',
    };
    const user = await this.usersService.findByEmail(email);

    if (!user || user.emailVerifiedAt) {
      return response;
    }

    const token = await this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.id = :userId', { userId: user.id })
        .getOneOrFail();

      return this.replaceEmailVerificationToken(user.id, manager);
    });

    try {
      await this.sendVerificationEmail(user.email, token);
    } catch (error: unknown) {
      this.logger.error(
        'Failed to resend an email verification message',
        error instanceof Error ? error.stack : undefined,
      );
    }

    return response;
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResult> {
    const response: ForgotPasswordResult = {
      message:
        'If an account exists for that email, a password reset link has been sent',
    };
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return response;
    }

    const token = await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(PasswordResetToken);
      await repository.delete({ userId: user.id });

      const token = randomBytes(32).toString('base64url');
      await repository.save(
        repository.create({
          userId: user.id,
          tokenHash: this.hashToken(token),
          expiresAt: new Date(Date.now() + this.passwordResetTtlMilliseconds),
          consumedAt: null,
        }),
      );

      return token;
    });

    try {
      await this.sendPasswordResetEmail(user.email, token);
    } catch (error: unknown) {
      this.logger.error(
        'Failed to send a password reset email',
        error instanceof Error ? error.stack : undefined,
      );
    }

    return response;
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<ResetPasswordResult> {
    const passwordHash = await this.passwordHasher.hash(newPassword);
    const tokenHash = this.hashToken(token);

    await this.dataSource.transaction(async (manager) => {
      const resetToken = await manager
        .getRepository(PasswordResetToken)
        .createQueryBuilder('resetToken')
        .setLock('pessimistic_write')
        .where('resetToken.tokenHash = :tokenHash', { tokenHash })
        .getOne();

      if (
        !resetToken ||
        resetToken.consumedAt ||
        resetToken.expiresAt.getTime() <= Date.now()
      ) {
        throw new BadRequestException(
          'Invalid or expired password reset token',
        );
      }

      const resetAt = new Date();
      await manager
        .getRepository(User)
        .update({ id: resetToken.userId }, { passwordHash });
      await manager
        .getRepository(PasswordResetToken)
        .update({ id: resetToken.id }, { consumedAt: resetAt });
      await manager
        .getRepository(AuthSession)
        .update({ userId: resetToken.userId }, { revokedAt: resetAt });
    });

    return { message: 'Password reset successfully' };
  }

  private async issueTokens(
    user: User,
    manager?: EntityManager,
  ): Promise<AuthenticationResult> {
    const refreshToken = randomBytes(32).toString('base64url');
    const refreshTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const repository =
      manager?.getRepository(AuthSession) ?? this.sessionsRepository;
    const session = await repository.save(
      repository.create({
        userId: user.id,
        refreshTokenHash,
        expiresAt: new Date(Date.now() + this.refreshTokenTtlMilliseconds),
        revokedAt: null,
      }),
    );
    return this.createAuthenticationResult(user, session.id, refreshToken);
  }

  private async createAuthenticationResult(
    user: User,
    sessionId: string,
    refreshToken: string,
  ): Promise<AuthenticationResult> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      sid: sessionId,
      jti: randomUUID(),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerifiedAt !== null,
      },
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTokenTtlSeconds,
    };
  }

  private async replaceEmailVerificationToken(
    userId: string,
    manager: EntityManager,
  ): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    const repository = manager.getRepository(EmailVerificationToken);

    await repository.delete({ userId });

    await repository.save(
      repository.create({
        userId,
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + this.emailVerificationTtlMilliseconds),
        consumedAt: null,
      }),
    );

    return token;
  }

  private async sendVerificationEmail(
    email: string,
    token: string,
  ): Promise<void> {
    const verificationUrl = new URL(this.emailVerificationUrl);
    verificationUrl.searchParams.set('token', token);
    const url = verificationUrl.toString();
    const htmlUrl = url.replaceAll('&', '&amp;');

    await this.mailService.send({
      to: email,
      subject: 'Verify your Odo email address',
      text: `Verify your Odo email address by opening this link: ${url}`,
      html: `<p>Welcome to Odo.</p><p><a href="${htmlUrl}">Verify your email address</a></p>`,
    });
  }

  private async sendPasswordResetEmail(
    email: string,
    token: string,
  ): Promise<void> {
    const resetUrl = new URL(this.passwordResetUrl);
    resetUrl.searchParams.set('token', token);
    const url = resetUrl.toString();
    const htmlUrl = url.replaceAll('&', '&amp;');

    await this.mailService.send({
      to: email,
      subject: 'Reset your Odo password',
      text: `Reset your Odo password by opening this link: ${url}`,
      html: `<p>We received a request to reset your Odo password.</p><p><a href="${htmlUrl}">Reset your password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as {
      code?: string;
      constraint?: string;
    };
    return (
      driverError.code === '23505' &&
      driverError.constraint === 'uq_users_email'
    );
  }
}
