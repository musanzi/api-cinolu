import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Venture } from '../entities/venture.entity';

@Injectable()
export class VenturesEmailService {
  constructor(private mailerService: MailerService) {}

  @OnEvent('venture.created')
  async sendBusinessCreatedEmail(venture: Venture): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: venture.owner.email,
        subject: 'Entreprise créée avec succès',
        text: [
          `Bonjour ${venture.owner.name},`,
          '',
          `Votre entreprise "${venture.name}" a ete creee avec succes sur CINOLU.`,
          '',
          "L'equipe CINOLU"
        ].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }

  @OnEvent('venture.approved')
  async sendVentureApprovalEmail(venture: Venture): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: venture.owner.email,
        subject: 'Votre entreprise a été approuvée!',
        text: [
          `Bonjour ${venture.owner.name},`,
          '',
          `Votre entreprise "${venture.name}" a ete approuvee.`,
          '',
          "L'equipe CINOLU"
        ].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }

  @OnEvent('venture.rejected')
  async sendVentureRejectionEmail(venture: Venture): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: venture.owner.email,
        subject: 'Décision concernant votre entreprise',
        text: [
          `Bonjour ${venture.owner.name},`,
          '',
          `Decision concernant votre entreprise "${venture.name}": elle n'a pas ete approuvee pour le moment.`,
          '',
          "L'equipe CINOLU"
        ].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }
}
