import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, type Repository } from 'typeorm';
import { AuthSession } from '../auth/entities/auth-session.entity.js';
import { EmailVerificationToken } from '../auth/entities/email-verification-token.entity.js';
import { PasswordResetToken } from '../auth/entities/password-reset-token.entity.js';

@Injectable()
export class AuthRecordsCleanupService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AuthRecordsCleanupService.name);
  private readonly intervalMilliseconds: number;
  private timer?: ReturnType<typeof setInterval>;
  private cleanupInProgress = false;

  constructor(
    @InjectRepository(AuthSession)
    private readonly sessionsRepository: Repository<AuthSession>,
    @InjectRepository(EmailVerificationToken)
    private readonly emailVerificationTokensRepository: Repository<EmailVerificationToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokensRepository: Repository<PasswordResetToken>,
    configService: ConfigService,
  ) {
    this.intervalMilliseconds =
      configService.getOrThrow<number>('AUTH_CLEANUP_INTERVAL_MINUTES') *
      60 *
      1000;
  }

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.cleanupExpiredRecords();
    }, this.intervalMilliseconds);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async cleanupExpiredRecords(): Promise<void> {
    if (this.cleanupInProgress) {
      return;
    }

    this.cleanupInProgress = true;
    const now = new Date();

    try {
      const [sessions, verificationTokens, resetTokens] = await Promise.all([
        this.sessionsRepository.delete({
          expiresAt: LessThanOrEqual(now),
        }),
        this.emailVerificationTokensRepository.delete({
          expiresAt: LessThanOrEqual(now),
        }),
        this.passwordResetTokensRepository.delete({
          expiresAt: LessThanOrEqual(now),
        }),
      ]);
      const deleted =
        (sessions.affected ?? 0) +
        (verificationTokens.affected ?? 0) +
        (resetTokens.affected ?? 0);

      if (deleted > 0) {
        this.logger.log(`Deleted ${deleted} expired authentication records`);
      }
    } catch (error: unknown) {
      this.logger.error(
        'Failed to clean up expired authentication records',
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.cleanupInProgress = false;
    }
  }
}
