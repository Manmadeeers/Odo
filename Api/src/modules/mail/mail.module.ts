import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { MAIL_TRANSPORT } from './mail.constants.js';
import { MailService } from './mail.service.js';

@Module({
  providers: [
    {
      provide: MAIL_TRANSPORT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const user = configService.get<string>('MAIL_USER');
        const password = configService.get<string>('MAIL_PASSWORD');

        return nodemailer.createTransport({
          host: configService.getOrThrow<string>('MAIL_HOST'),
          port: configService.getOrThrow<number>('MAIL_PORT'),
          secure: configService.getOrThrow<boolean>('MAIL_SECURE'),
          auth: user && password ? { user, pass: password } : undefined,
        });
      },
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
