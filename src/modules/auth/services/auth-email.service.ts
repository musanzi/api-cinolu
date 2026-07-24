import { User } from '@/modules/users/entities/user.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ContactSupportDto } from '../dto/contact-support.dto';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthEmailService {
  constructor(private mailerService: MailerService) {}

  @OnEvent('user.welcome')
  async sendWelcomeEmail(user: User): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Bienvenue sur CINOLU',
        text: [`Bonjour ${user.name},`, '', 'Bienvenue sur CINOLU.', '', "L'equipe CINOLU"].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }

  @OnEvent('user.reset-password')
  async resetEmail(payload: { user: User; link: string }): Promise<void> {
    try {
      const { user, link } = payload;
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Réinitialisation du mot de passe',
        text: [
          `Bonjour ${user.name},`,
          '',
          'Vous avez demande la reinitialisation de votre mot de passe.',
          `Lien: ${link}`,
          '',
          "Si vous n'etes pas a l'origine de cette demande, ignorez cet email.",
          '',
          "L'equipe CINOLU"
        ].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }

  @OnEvent('contact.support')
  async contactSupport(dto: ContactSupportDto): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: process.env.SUPPORT_EMAIL,
        subject: `One Stop Contact from ${dto.name}`,
        text: [
          'New support contact request',
          '',
          `Name: ${dto.name}`,
          `Email: ${dto.email}`,
          `Country: ${dto.country}`,
          `Phone: ${dto.phone_number}`,
          '',
          'Message:',
          dto.message
        ].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }
}
