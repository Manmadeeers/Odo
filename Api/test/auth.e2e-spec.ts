import { createHash, randomUUID } from 'node:crypto';
import { PasswordHasher } from '@nestjs/authentication';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { AuthSession } from '../src/modules/auth/entities/auth-session.entity.js';
import { EmailVerificationToken } from '../src/modules/auth/entities/email-verification-token.entity.js';
import { PasswordResetToken } from '../src/modules/auth/entities/password-reset-token.entity.js';
import { MailService } from '../src/modules/mail/mail.service.js';
import { User } from '../src/modules/users/entities/user.entity.js';

interface AuthResponse {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

describe('Authentication endpoints (e2e)', () => {
  let app: NestFastifyApplication | undefined;
  let dataSource: DataSource;
  const email = `auth-${randomUUID()}@example.com`;
  const password = 'correct horse battery staple';
  const newPassword = 'new correct horse battery staple';
  const sendMail = vi.fn().mockResolvedValue(undefined);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PasswordHasher)
      .useValue(new PasswordHasher({ logN: 10 }))
      .overrideProvider(MailService)
      .useValue({ send: sendMail })
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    dataSource = app.get(DataSource);
  });

  it('rejects an invalid registration payload', async () => {
    if (!app) {
      throw new Error('Test application was not initialized');
    }

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'not-an-email', password: 'short' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('registers and logs in without persisting credentials in plaintext', async () => {
    if (!app) {
      throw new Error('Test application was not initialized');
    }

    const registrationResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: `  ${email.toUpperCase()}  `, password },
    });
    const registration = registrationResponse.json<AuthResponse>();

    expect(registrationResponse.statusCode).toBe(201);
    expect(registration.user).toMatchObject({
      email,
      emailVerified: false,
    });
    expect(registration.user).not.toHaveProperty('passwordHash');
    expect(registration.accessToken).toBeTypeOf('string');
    expect(registration.refreshToken).toBeTypeOf('string');
    expect(registration.tokenType).toBe('Bearer');
    expect(registration.expiresIn).toBe(900);

    expect(sendMail).toHaveBeenCalledOnce();
    const sentMail = sendMail.mock.calls[0]?.[0] as
      { to: string; text: string } | undefined;
    expect(sentMail?.to).toBe(email);
    const verificationUrl = sentMail?.text.match(/https?:\/\/\S+$/)?.[0];
    expect(verificationUrl).toBeDefined();
    const verificationToken = new URL(verificationUrl!).searchParams.get(
      'token',
    );
    expect(verificationToken).toBeTypeOf('string');
    let activeVerificationToken = verificationToken!;

    const storedUser = await dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id: registration.user.id })
      .getOneOrFail();
    expect(storedUser.passwordHash).toMatch(/^\$scrypt\$/);
    expect(storedUser.passwordHash).not.toContain(password);

    const storedSession = await dataSource
      .getRepository(AuthSession)
      .createQueryBuilder('session')
      .addSelect('session.refreshTokenHash')
      .where('session.userId = :userId', { userId: registration.user.id })
      .getOneOrFail();
    expect(storedSession.refreshTokenHash).toBe(
      createHash('sha256').update(registration.refreshToken).digest('hex'),
    );
    expect(storedSession.refreshTokenHash).not.toBe(registration.refreshToken);

    const storedVerification = await dataSource
      .getRepository(EmailVerificationToken)
      .createQueryBuilder('verification')
      .addSelect('verification.tokenHash')
      .where('verification.userId = :userId', {
        userId: registration.user.id,
      })
      .getOneOrFail();
    expect(storedVerification.tokenHash).toBe(
      createHash('sha256').update(verificationToken!).digest('hex'),
    );
    expect(storedVerification.tokenHash).not.toBe(verificationToken);

    const unknownResendResponse = await app.inject({
      method: 'POST',
      url: '/auth/resend-verification-email',
      payload: { email: `missing-${randomUUID()}@example.com` },
    });
    expect(unknownResendResponse.statusCode).toBe(202);
    expect(unknownResendResponse.json()).toEqual({
      message:
        'If an unverified account exists for that email, a verification link has been sent',
    });
    expect(sendMail).toHaveBeenCalledOnce();

    const resendResponse = await app.inject({
      method: 'POST',
      url: '/auth/resend-verification-email',
      payload: { email: `  ${email.toUpperCase()}  ` },
    });
    expect(resendResponse.statusCode).toBe(202);
    expect(resendResponse.json()).toEqual(unknownResendResponse.json());
    expect(sendMail).toHaveBeenCalledTimes(2);

    const resentMail = sendMail.mock.calls[1]?.[0] as
      { to: string; text: string } | undefined;
    const resentUrl = resentMail?.text.match(/https?:\/\/\S+$/)?.[0];
    expect(resentUrl).toBeDefined();
    activeVerificationToken = new URL(resentUrl!).searchParams.get('token')!;
    expect(activeVerificationToken).toBeTypeOf('string');
    expect(activeVerificationToken).not.toBe(verificationToken);

    const replacedTokenResponse = await app.inject({
      method: 'POST',
      url: '/auth/confirm-email',
      payload: { token: verificationToken },
    });
    expect(replacedTokenResponse.statusCode).toBe(400);

    const duplicateResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email, password },
    });
    expect(duplicateResponse.statusCode).toBe(409);

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    expect(loginResponse.statusCode).toBe(403);
    expect(loginResponse.json()).toMatchObject({
      message: 'Email address is not verified',
    });

    const unverifiedRefreshResponse = await app.inject({
      method: 'POST',
      url: '/auth/refresh-token',
      payload: { refreshToken: registration.refreshToken },
    });
    expect(unverifiedRefreshResponse.statusCode).toBe(403);

    const invalidConfirmationResponse = await app.inject({
      method: 'POST',
      url: '/auth/confirm-email',
      payload: { token: randomUUID() },
    });
    expect(invalidConfirmationResponse.statusCode).toBe(400);

    const confirmationResponse = await app.inject({
      method: 'POST',
      url: '/auth/confirm-email',
      payload: { token: activeVerificationToken },
    });
    expect(confirmationResponse.statusCode).toBe(200);
    expect(confirmationResponse.json()).toEqual({
      message: 'Email confirmed',
    });

    const repeatedConfirmationResponse = await app.inject({
      method: 'POST',
      url: '/auth/confirm-email',
      payload: { token: activeVerificationToken },
    });
    expect(repeatedConfirmationResponse.statusCode).toBe(200);

    const confirmedUser = await dataSource
      .getRepository(User)
      .findOneByOrFail({ id: registration.user.id });
    expect(confirmedUser.emailVerifiedAt).toBeInstanceOf(Date);

    const verifiedResendResponse = await app.inject({
      method: 'POST',
      url: '/auth/resend-verification-email',
      payload: { email },
    });
    expect(verifiedResendResponse.statusCode).toBe(202);
    expect(sendMail).toHaveBeenCalledTimes(2);

    const verifiedLoginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    const verifiedLogin = verifiedLoginResponse.json<AuthResponse>();
    expect(verifiedLoginResponse.statusCode).toBe(200);
    expect(verifiedLogin.user).toMatchObject({
      id: registration.user.id,
      emailVerified: true,
    });
    expect(verifiedLogin.accessToken).not.toBe(registration.accessToken);
    expect(verifiedLogin.refreshToken).not.toBe(registration.refreshToken);

    const unauthenticatedMeResponse = await app.inject({
      method: 'GET',
      url: '/users/me',
    });
    expect(unauthenticatedMeResponse.statusCode).toBe(401);

    const meResponse = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: { authorization: `Bearer ${verifiedLogin.accessToken}` },
    });
    expect(meResponse.statusCode).toBe(200);
    expect(meResponse.json()).toEqual(verifiedLogin.user);

    const refreshResponse = await app.inject({
      method: 'POST',
      url: '/auth/refresh-token',
      payload: { refreshToken: verifiedLogin.refreshToken },
    });
    const refreshed = refreshResponse.json<AuthResponse>();
    expect(refreshResponse.statusCode).toBe(200);
    expect(refreshed.refreshToken).not.toBe(verifiedLogin.refreshToken);
    expect(refreshed.accessToken).not.toBe(verifiedLogin.accessToken);

    const reusedRefreshResponse = await app.inject({
      method: 'POST',
      url: '/auth/refresh-token',
      payload: { refreshToken: verifiedLogin.refreshToken },
    });
    expect(reusedRefreshResponse.statusCode).toBe(401);

    const refreshedMeResponse = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: { authorization: `Bearer ${refreshed.accessToken}` },
    });
    expect(refreshedMeResponse.statusCode).toBe(200);

    const logoutResponse = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { authorization: `Bearer ${refreshed.accessToken}` },
    });
    expect(logoutResponse.statusCode).toBe(200);
    expect(logoutResponse.json()).toEqual({ message: 'Logged out' });

    const revokedMeResponse = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: { authorization: `Bearer ${refreshed.accessToken}` },
    });
    expect(revokedMeResponse.statusCode).toBe(401);

    const revokedRefreshResponse = await app.inject({
      method: 'POST',
      url: '/auth/refresh-token',
      payload: { refreshToken: refreshed.refreshToken },
    });
    expect(revokedRefreshResponse.statusCode).toBe(401);

    const invalidLoginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password: 'incorrect password' },
    });
    expect(invalidLoginResponse.statusCode).toBe(401);
    expect(invalidLoginResponse.json()).toMatchObject({
      message: 'Invalid email or password',
    });

    const unknownForgotPasswordResponse = await app.inject({
      method: 'POST',
      url: '/auth/forgot-password',
      payload: { email: `missing-${randomUUID()}@example.com` },
    });
    expect(unknownForgotPasswordResponse.statusCode).toBe(202);
    expect(unknownForgotPasswordResponse.json()).toEqual({
      message:
        'If an account exists for that email, a password reset link has been sent',
    });
    expect(sendMail).toHaveBeenCalledTimes(2);

    const forgotPasswordResponse = await app.inject({
      method: 'POST',
      url: '/auth/forgot-password',
      payload: { email: `  ${email.toUpperCase()}  ` },
    });
    expect(forgotPasswordResponse.statusCode).toBe(202);
    expect(forgotPasswordResponse.json()).toEqual(
      unknownForgotPasswordResponse.json(),
    );
    expect(sendMail).toHaveBeenCalledTimes(3);

    const resetMail = sendMail.mock.calls[2]?.[0] as
      { to: string; text: string } | undefined;
    expect(resetMail?.to).toBe(email);
    const resetUrl = resetMail?.text.match(/https?:\/\/\S+$/)?.[0];
    expect(resetUrl).toBeDefined();
    const resetToken = new URL(resetUrl!).searchParams.get('token');
    expect(resetToken).toBeTypeOf('string');

    const storedResetToken = await dataSource
      .getRepository(PasswordResetToken)
      .createQueryBuilder('resetToken')
      .addSelect('resetToken.tokenHash')
      .where('resetToken.userId = :userId', {
        userId: registration.user.id,
      })
      .getOneOrFail();
    expect(storedResetToken.tokenHash).toBe(
      createHash('sha256').update(resetToken!).digest('hex'),
    );
    expect(storedResetToken.tokenHash).not.toBe(resetToken);

    const invalidResetResponse = await app.inject({
      method: 'POST',
      url: '/auth/reset-password',
      payload: { token: randomUUID(), newPassword },
    });
    expect(invalidResetResponse.statusCode).toBe(400);

    const resetResponse = await app.inject({
      method: 'POST',
      url: '/auth/reset-password',
      payload: { token: resetToken, newPassword },
    });
    expect(resetResponse.statusCode).toBe(200);
    expect(resetResponse.json()).toEqual({
      message: 'Password reset successfully',
    });

    const reusedResetResponse = await app.inject({
      method: 'POST',
      url: '/auth/reset-password',
      payload: { token: resetToken, newPassword },
    });
    expect(reusedResetResponse.statusCode).toBe(400);

    const sessions = await dataSource
      .getRepository(AuthSession)
      .findBy({ userId: registration.user.id });
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions.every((session) => session.revokedAt instanceof Date)).toBe(
      true,
    );

    const oldPasswordLoginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    expect(oldPasswordLoginResponse.statusCode).toBe(401);

    const newPasswordLoginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password: newPassword },
    });
    expect(newPasswordLoginResponse.statusCode).toBe(200);
    expect(newPasswordLoginResponse.json<AuthResponse>().user).toMatchObject({
      id: registration.user.id,
      emailVerified: true,
    });
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.getRepository(User).delete({ email });
    }
    await app?.close();
  });
});
