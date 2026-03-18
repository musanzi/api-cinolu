import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { existsSync } from 'fs';
import { join } from 'path';
import { htmlToText } from 'html-to-text';
import { User } from '@/modules/users/entities/user.entity';
import { Notification } from '@/modules/notifications/entities/notification.entity';

@Injectable()
export class ProjectsEmailService {
  constructor(private mailerService: MailerService) {}

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
