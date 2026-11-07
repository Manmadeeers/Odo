import { createHash, randomBytes } from 'node:crypto';
import { PasswordHasher } from '@nestjs/authentication';
import {
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
import type { AuthenticationResult } from './auth.types.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import { AuthSession } from './entities/auth-session.entity.js';

@Injectable()
export class AuthService {
  private readonly accessTokenTtlSeconds: number;
  private readonly refreshTokenTtlMilliseconds: number;

  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(AuthSession)
    private readonly sessionsRepository: Repository<AuthSession>,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly passwordHasher: PasswordHasher,
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
  }

  async register(input: RegisterDto): Promise<AuthenticationResult> {
    const passwordHash = await this.passwordHasher.hash(input.password);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const user = await this.usersService.create(
          input.email,
          passwordHash,
          manager,
        );
        return this.issueTokens(user, manager);
      });
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
      throw error;
    }
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
