import { createHash, randomBytes } from 'node:crypto';
import { PasswordHasher } from '@nestjs/authentication';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  QueryFailedError,
  type EntityManager,
  type Repository,
} from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { MailService } from '../mail/mail.service.js';
import type {
  AuthenticationResult,
  EmailConfirmationResult,
} from './auth.types.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import { AuthSession } from './entities/auth-session.entity.js';
import { EmailVerificationToken } from './entities/email-verification-token.entity.js';

@Injectable()
export class AuthService {
  private readonly accessTokenTtlSeconds: number;
  private readonly refreshTokenTtlMilliseconds: number;
  private readonly emailVerificationTtlMilliseconds: number;
  private readonly emailVerificationUrl: string;

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
  }

  async register(input: RegisterDto): Promise<AuthenticationResult> {
    const passwordHash = await this.passwordHasher.hash(input.password);

    try {
      const { authentication, verificationToken } =
        await this.dataSource.transaction(async (manager) => {
          const user = await this.usersService.create(
            input.email,
            passwordHash,
            manager,
          );
          const verificationToken = await this.createEmailVerificationToken(
            user.id,
            manager,
          );
          const authentication = await this.issueTokens(user, manager);

          return { authentication, verificationToken };
        });

      await this.sendVerificationEmail(
        authentication.user.email,
        verificationToken,
      );

      return authentication;
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

    if (this.passwordHasher.needsRehash(user.passwordHash)) {
      await this.usersService.updatePasswordHash(
        user.id,
        await this.passwordHasher.hash(input.password),
      );
    }

    return this.issueTokens(user);
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
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      sid: session.id,
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

  private async createEmailVerificationToken(
    userId: string,
    manager: EntityManager,
  ): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    const repository = manager.getRepository(EmailVerificationToken);

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
