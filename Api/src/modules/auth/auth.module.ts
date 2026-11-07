import { Module } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module.js';
import { UsersModule } from '../users/users.module.js';
import { AccessTokenGuard } from './access-token.guard.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { CurrentUserController } from './current-user.controller.js';
import { AuthSession } from './entities/auth-session.entity.js';
import { EmailVerificationToken } from './entities/email-verification-token.entity.js';
import { PasswordResetToken } from './entities/password-reset-token.entity.js';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      AuthSession,
      EmailVerificationToken,
      PasswordResetToken,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          issuer: configService.getOrThrow<string>('JWT_ISSUER'),
          audience: configService.getOrThrow<string>('JWT_AUDIENCE'),
          expiresIn: configService.getOrThrow<number>('JWT_ACCESS_TTL_SECONDS'),
        },
      }),
    }),
    MailModule,
    UsersModule,
  ],
  controllers: [AuthController, CurrentUserController],
  providers: [AccessTokenGuard, AuthService, PasswordHasher],
})
export class AuthModule {}
