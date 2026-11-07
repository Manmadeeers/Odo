import { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';
import { AuthSession } from '../auth/entities/auth-session.entity.js';
import { EmailVerificationToken } from '../auth/entities/email-verification-token.entity.js';
import { PasswordResetToken } from '../auth/entities/password-reset-token.entity.js';
import { AuthRecordsCleanupService } from './auth-records-cleanup.service.js';

describe('AuthRecordsCleanupService', () => {
  it('periodically deletes expired authentication records', async () => {
    vi.useFakeTimers();
    const deleteSessions = vi.fn().mockResolvedValue({ affected: 1 });
    const deleteVerificationTokens = vi.fn().mockResolvedValue({ affected: 1 });
    const deleteResetTokens = vi.fn().mockResolvedValue({ affected: 1 });
    const sessionsRepository = {
      delete: deleteSessions,
    } as unknown as Repository<AuthSession>;
    const verificationRepository = {
      delete: deleteVerificationTokens,
    } as unknown as Repository<EmailVerificationToken>;
    const resetRepository = {
      delete: deleteResetTokens,
    } as unknown as Repository<PasswordResetToken>;
    const configService = {
      getOrThrow: vi.fn().mockReturnValue(1),
    } as unknown as ConfigService;
    const service = new AuthRecordsCleanupService(
      sessionsRepository,
      verificationRepository,
      resetRepository,
      configService,
    );

    service.onModuleInit();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(deleteSessions).toHaveBeenCalledOnce();
    expect(deleteVerificationTokens).toHaveBeenCalledOnce();
    expect(deleteResetTokens).toHaveBeenCalledOnce();

    service.onModuleDestroy();
    vi.useRealTimers();
  });
});
