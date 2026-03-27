import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { existsSync } from 'fs';
import { join } from 'path';
import { htmlToText } from 'html-to-text';
import { User } from '@/modules/users/entities/user.entity';
import { Notification } from '@/modules/notifications/entities/notification.entity';
import { Project } from '../entities/project.entity';
import { Phase } from '../phases/entities/phase.entity';

@Injectable()
export class ProjectsEmailService {
  constructor(private mailerService: MailerService) {}

  @OnEvent('participation.review')
  async sendParticipationReview(payload: {
    user: User;
    project: Project;
    phase: Phase;
    score: number;
    message?: string;
    nextPhase?: Phase | null;
  }): Promise<void> {
    try {
      const { user, project, phase, score, message, nextPhase } = payload;
      const email = user?.email?.trim();
      if (!email) return;
      const status = score >= 60 ? 'retenue' : 'non retenue';
      const nextPhaseLine = nextPhase
        ? `<p><strong>Prochaine phase:</strong> ${nextPhase.name}</p>`
        : score >= 60
          ? '<p>Aucune autre phase n’est disponible pour ce projet.</p>'
          : '';
      const reviewerMessage = message ? `<p><strong>Message du reviewer:</strong> ${message}</p>` : '';
      const html = `
        <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;">
          <p>Bonjour ${user?.name ?? ''},</p>
          <p>Votre participation au projet <strong>${project?.name ?? ''}</strong> pour la phase <strong>${phase?.name ?? ''}</strong> est ${status}.</p>
          <p><strong>Score:</strong> ${score}/100</p>
          ${reviewerMessage}
          ${nextPhaseLine}
        </div>
      `;
      const text = htmlToText(html, {
        wordwrap: 120,
        selectors: [{ selector: 'img', format: 'skip' }]
      });
      await this.mailerService.sendMail({
        to: email,
        subject: `${project?.name ?? 'Projet'} - Mise à jour de participation`,
        html,
        text
      });
    } catch {
      return;
    }
  }

  @OnEvent('notify.participants')
  async notifyParticipants(recipients: User[] = [], notification: Notification): Promise<void> {
    const emails = Array.from(new Set(recipients.map((r) => r?.email?.trim())));
    if (emails.length === 0) return;
    const attachments = this.resolveExistingAttachments(notification);
    const subject = `${notification.project?.name ?? 'Project'} - ${notification.title}`;
    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;">
        <p><strong>Projet:</strong> ${notification.project?.name}</p>
        <hr />
        ${notification.body ?? ''}
      </div>
    `;
    const text = htmlToText(html, {
      wordwrap: 120,
      selectors: [{ selector: 'img', format: 'skip' }]
    });
    for (const email of emails) {
      try {
        await this.mailerService.sendMail({
          to: email,
          subject,
          html,
          text,
          ...(attachments?.length ? { attachments } : {})
        });
      } catch {
        continue;
      }
    }
  }

  private resolveExistingAttachments(notification: Notification) {
    const files = (notification.attachments || [])
      .map((attachment) => {
        const filePath = join(process.cwd(), 'uploads', 'notifications', attachment.filename);
        if (!existsSync(filePath)) return null;
        return { filename: attachment.filename, path: filePath };
      })
      .filter((a) => a !== null);
    return files.length ? files : undefined;
  }
}
