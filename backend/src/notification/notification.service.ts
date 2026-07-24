import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

@Injectable()
export class NotificationService {
  private readonly sesClient: SESClient;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('app.aws.endpoint', 'http://localhost:4566');
    const region = this.configService.get<string>('app.aws.region', 'us-east-1');
    const accessKeyId = this.configService.get<string>('app.aws.accessKeyId') || 'test';
    const secretAccessKey = this.configService.get<string>('app.aws.secretAccessKey') || 'test';

    this.sesClient = new SESClient({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.fromEmail = this.configService.get<string>('app.aws.ses.fromEmail', 'noreply@kuph.app');
  }

  private async sendEmail(
    to: string,
    subject: string,
    bodyHtml: string,
  ): Promise<void> {
    const command = new SendEmailCommand({
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: bodyHtml,
            Charset: 'UTF-8',
          },
        },
      },
    });

    await this.sesClient.send(command);
  }

  async sendMagicLinkEmail(email: string, magicLink: string): Promise<void> {
    const subject = 'Your Magic Sign-In Link';
    const bodyHtml = [
      '<h1>Sign In to KUPH</h1>',
      '<p>Click the link below to sign in. This link will expire in 15 minutes.</p>',
      '<a href="' + magicLink + '">Sign In</a>',
    ].join('\n');

    await this.sendEmail(email, subject, bodyHtml);
  }

  async sendInviteEmail(email: string, inviteLink: string): Promise<void> {
    const subject = "You've Been Invited to Join KUPH";
    const bodyHtml = [
      '<h1>Welcome to KUPH</h1>',
      "<p>You've been invited to join an agency on KUPH. Click the link below to accept.</p>",
      '<a href="' + inviteLink + '">Accept Invite</a>',
    ].join('\n');

    await this.sendEmail(email, subject, bodyHtml);
  }

  async sendAlert(email: string, alertMessage: string): Promise<void> {
    const subject = 'KUPH Alert';
    const bodyHtml = [
      '<h1>Alert</h1>',
      '<p>' + alertMessage + '</p>',
    ].join('\n');

    await this.sendEmail(email, subject, bodyHtml);
  }
}
