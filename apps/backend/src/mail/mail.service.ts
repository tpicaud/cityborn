import { ErrorCode } from '@cityborn/errors';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST'),
            port: Number(this.configService.get<string>('SMTP_PORT')),
            secure: false, // true pour 465
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        });
    }

    async sendVerificationEmail(email: string, token: string) {
        try {
            const frontendUrl = this.configService.get<string>('FRONTEND_URL');
            const url = `${frontendUrl}/verify-email?token=${token}`;

            await this.transporter.sendMail({
                from: `"CityBorn" <${this.configService.get<string>('SMTP_USER')}>`,
                to: email,
                idject: 'Vérification de votre email CityBorn',
                html: `
        <p>Bienvenue chez CityBorn !</p>
        <p>Cliquez sur le lien ci-dessous pour vérifier votre email :</p>
        <a href="${url}">Vérifier mon email</a>
      `,
            });
        } catch (error) {
            throw new InternalServerErrorException({ code: ErrorCode.EMAIL_SEND_FAILED, message: `Error sending verification email: ${error.message}` })
        }
    }
}
