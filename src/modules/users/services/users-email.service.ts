import { MailerService } from '@nestjs-modules/mailer';
import { OnEvent } from '@nestjs/event-emitter';
import { User } from '../entities/user.entity';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class UsersEmailService {
  constructor(private mailerService: MailerService) {}

  @OnEvent('user.referral-signup')
  async sendReferralSignupEmail(payload: { referredBy: User; newUser: User }): Promise<void> {
    try {
      const { referredBy, newUser } = payload;
      await this.mailerService.sendMail({
        to: referredBy.email,
        subject: 'Un nouvel utilisateur a rejoint CINOLU grâce à votre lien de parrainage',
        text: [
          `Bonjour ${referredBy.name},`,
          '',
          `${newUser.name} (${newUser.email}) a rejoint CINOLU grace a votre lien de parrainage.`,
          '',
          "L'equipe CINOLU"
        ].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }
}
