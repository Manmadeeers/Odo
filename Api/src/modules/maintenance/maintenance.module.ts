import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSession } from '../auth/entities/auth-session.entity.js';
import { EmailVerificationToken } from '../auth/entities/email-verification-token.entity.js';
import { PasswordResetToken } from '../auth/entities/password-reset-token.entity.js';
import { AuthRecordsCleanupService } from './auth-records-cleanup.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuthSession,
      EmailVerificationToken,
      PasswordResetToken,
    ]),
  ],
  providers: [AuthRecordsCleanupService],
})
export class MaintenanceModule {}
