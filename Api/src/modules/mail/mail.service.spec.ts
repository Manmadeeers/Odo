import { ConfigService } from '@nestjs/config';
import type { Transporter } from 'nodemailer';
import { MailService } from './mail.service.js';

describe('MailService', () => {
  it('sends through the configured transport and supplies the default sender', async () => {
    const sendMail = vi.fn().mockResolvedValue(undefined);
    const transporter = { sendMail } as unknown as Transporter;
    const configService = {
      getOrThrow: vi.fn().mockReturnValue('Odo <noreply@odo.local>'),
    } as unknown as ConfigService;
    const service = new MailService(transporter, configService);

    await service.send({
      to: 'rider@example.com',
      subject: 'Verify your Odo account',
      text: 'Verification text',
      html: '<p>Verification text</p>',
    });

    expect(sendMail).toHaveBeenCalledOnce();
    expect(sendMail).toHaveBeenCalledWith({
      from: 'Odo <noreply@odo.local>',
      to: 'rider@example.com',
      subject: 'Verify your Odo account',
      text: 'Verification text',
      html: '<p>Verification text</p>',
    });
  });
});
