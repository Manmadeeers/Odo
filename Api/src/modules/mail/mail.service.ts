import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Transporter } from 'nodemailer';
import { MAIL_TRANSPORT } from './mail.constants.js';
import type { SendMailInput } from './mail.types.js';

@Injectable()
export class MailService {
  private readonly from: string;

  constructor(
    @Inject(MAIL_TRANSPORT) private readonly transporter: Transporter,
    configService: ConfigService,
  ) {
    this.from = configService.getOrThrow<string>('MAIL_FROM');
  }

  async send(input: SendMailInput): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      ...input,
    });
  }
}
