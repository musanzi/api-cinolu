import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MentorProfile } from '../entities/mentor.entity';

@Injectable()
export class MentorsEmailService {
  constructor(private mailerService: MailerService) {}

  @OnEvent('mentor.approved')
  async sendMentorApprovalEmail(mentorProfile: MentorProfile): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: mentorProfile.owner.email,
        subject: 'Votre profil de mentor a été approuvé!',
        text: [
          `Bonjour ${mentorProfile.owner.name},`,
          '',
          'Votre profil de mentor a ete approuve.',
          '',
          "L'equipe CINOLU"
        ].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }

  @OnEvent('mentor.rejected')
  async sendMentorRejectionEmail(mentorProfile: MentorProfile): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: mentorProfile.owner.email,
        subject: 'Décision concernant votre profil de mentor',
        text: [
          `Bonjour ${mentorProfile.owner.name},`,
          '',
          "Votre profil de mentor n'a pas ete approuve pour le moment.",
          '',
          "L'equipe CINOLU"
        ].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }

  @OnEvent('mentor.application')
  async sendMentorApplicationEmail(mentorProfile: MentorProfile): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: mentorProfile.owner.email,
        subject: 'Candidature de mentor reçue',
        text: [
          `Bonjour ${mentorProfile.owner.name},`,
          '',
          'Votre candidature de mentor a bien ete recue et sera examinee.',
          '',
          "L'equipe CINOLU"
        ].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }
}
