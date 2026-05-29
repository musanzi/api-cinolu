import { BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { NotificationAttachmentsService } from '@/modules/notifications/services/notification-attachments.service';

describe('NotificationAttachmentsService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const setup = () => {
    const attachmentsRepository = {
      save: jest.fn(),
      findOneOrFail: jest.fn(),
      delete: jest.fn()
    } as any;
    const notificationsService = {
      findOne: jest.fn()
    } as any;
    const service = new NotificationAttachmentsService(attachmentsRepository, notificationsService);
    return { service, attachmentsRepository, notificationsService };
  };

  it('adds attachments to notification', async () => {
    const { service, attachmentsRepository, notificationsService } = setup();
    notificationsService.findOne.mockResolvedValue({ id: 'n1' });
    attachmentsRepository.save.mockResolvedValue([{ id: 'a1' }]);
    const files = [{ filename: 'doc.pdf', mimetype: 'application/pdf' }] as any;
    await expect(service.addAttachments('n1', files)).resolves.toEqual([{ id: 'a1' }]);
    expect(attachmentsRepository.save).toHaveBeenCalledWith([
      {
        filename: 'doc.pdf',
        mimetype: 'application/pdf',
        notification: { id: 'n1' }
      }
    ]);
  });

  it('throws on addAttachments failure', async () => {
    const { service, notificationsService } = setup();
    notificationsService.findOne.mockRejectedValue(new Error('bad'));
    await expect(service.addAttachments('n1', [] as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds one attachment', async () => {
    const { service, attachmentsRepository } = setup();
    attachmentsRepository.findOneOrFail.mockResolvedValue({ id: 'a1' });
    await expect(service.findAttachment('a1')).resolves.toEqual({ id: 'a1' });
  });

  it('throws on findAttachment failure', async () => {
    const { service, attachmentsRepository } = setup();
    attachmentsRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.findAttachment('a1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('removes attachment and unlinks file when filename exists', async () => {
    const { service, attachmentsRepository } = setup();
    jest.spyOn(service, 'findAttachment').mockResolvedValue({ id: 'a1', filename: 'doc.pdf' } as any);
    const unlinkSpy = jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
    attachmentsRepository.delete.mockResolvedValue(undefined);
    await expect(service.removeAttachment('a1')).resolves.toBeUndefined();
    expect(unlinkSpy).toHaveBeenCalledWith('./uploads/notifications/doc.pdf');
    expect(attachmentsRepository.delete).toHaveBeenCalledWith({ id: 'a1', filename: 'doc.pdf' });
  });

  it('ignores unlink failure and still deletes attachment', async () => {
    const { service, attachmentsRepository } = setup();
    jest.spyOn(service, 'findAttachment').mockResolvedValue({ id: 'a1', filename: 'doc.pdf' } as any);
    const unlinkSpy = jest.spyOn(fs, 'unlink').mockRejectedValue(new Error('missing file'));
    attachmentsRepository.delete.mockResolvedValue(undefined);
    await expect(service.removeAttachment('a1')).resolves.toBeUndefined();
    expect(unlinkSpy).toHaveBeenCalled();
    expect(attachmentsRepository.delete).toHaveBeenCalled();
  });

  it('removes attachment without unlink when filename is missing', async () => {
    const { service, attachmentsRepository } = setup();
    const unlinkSpy = jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
    jest.spyOn(service, 'findAttachment').mockResolvedValue({ id: 'a1', filename: '' } as any);
    attachmentsRepository.delete.mockResolvedValue(undefined);
    await expect(service.removeAttachment('a1')).resolves.toBeUndefined();
    expect(unlinkSpy).not.toHaveBeenCalled();
  });

  it('throws on removeAttachment failure', async () => {
    const { service } = setup();
    jest.spyOn(service, 'findAttachment').mockRejectedValue(new Error('bad'));
    await expect(service.removeAttachment('a1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
