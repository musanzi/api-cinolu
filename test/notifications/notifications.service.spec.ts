import { BadRequestException } from '@nestjs/common';
import { NotificationsService } from '@/modules/notifications/services/notifications.service';
import { NotificationStatus } from '@/modules/notifications/types/notification-status.enum';

const makeQueryBuilder = (result: [any[], number] = [[], 0]) => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue(result)
});

describe('NotificationsService', () => {
  const setup = () => {
    const queryBuilder = makeQueryBuilder([[{ id: 'n1' }], 1]);
    const notificationsRepository = {
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOneOrFail: jest.fn(),
      merge: jest.fn(),
      softDelete: jest.fn()
    } as any;
    const usersService = {
      findStaff: jest.fn()
    } as any;
    const eventEmitter = {
      emit: jest.fn()
    } as any;
    const service = new NotificationsService(notificationsRepository, usersService, eventEmitter);
    return { service, notificationsRepository, queryBuilder, usersService, eventEmitter };
  };

  it('creates notification with optional phase', async () => {
    const { service, notificationsRepository } = setup();
    notificationsRepository.save.mockResolvedValue({ id: 'n1' });
    await expect(service.create('p1', 'u1', { title: 'hello', phase_id: 'ph1' } as any)).resolves.toEqual({ id: 'n1' });
    expect(notificationsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        project: { id: 'p1' },
        sender: { id: 'u1' },
        phase: { id: 'ph1' }
      })
    );
  });

  it('creates notification without phase', async () => {
    const { service, notificationsRepository } = setup();
    notificationsRepository.save.mockResolvedValue({ id: 'n2' });
    await service.create('p1', 'u1', { title: 'hello' } as any);
    expect(notificationsRepository.save).toHaveBeenCalledWith(expect.objectContaining({ phase: null }));
  });

  it('throws on create failure', async () => {
    const { service, notificationsRepository } = setup();
    notificationsRepository.save.mockRejectedValue(new Error('bad'));
    await expect(service.create('p1', 'u1', {} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sends notification', async () => {
    const { service, notificationsRepository } = setup();
    notificationsRepository.update.mockResolvedValue(undefined);
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'n1', status: NotificationStatus.SENT } as any);
    await expect(service.send('n1')).resolves.toEqual({ id: 'n1', status: NotificationStatus.SENT });
    expect(notificationsRepository.update).toHaveBeenCalledWith('n1', { status: NotificationStatus.SENT });
  });

  it('throws on send failure', async () => {
    const { service, notificationsRepository } = setup();
    notificationsRepository.update.mockRejectedValue(new Error('bad'));
    await expect(service.send('n1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds project notifications with filters', async () => {
    const { service, queryBuilder } = setup();
    await expect(
      service.findByProject('p1', { page: 2, phaseId: 'ph1', status: NotificationStatus.DRAFT } as any)
    ).resolves.toEqual([[{ id: 'n1' }], 1]);
    expect(queryBuilder.where).toHaveBeenCalledWith('n.projectId = :projectId', { projectId: 'p1' });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('n.phaseId = :phaseId', { phaseId: 'ph1' });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('n.status = :status', { status: NotificationStatus.DRAFT });
    expect(queryBuilder.skip).toHaveBeenCalledWith(10);
    expect(queryBuilder.take).toHaveBeenCalledWith(10);
  });

  it('throws on findByProject failure', async () => {
    const { service, queryBuilder } = setup();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    queryBuilder.getManyAndCount.mockRejectedValue(new Error('bad'));
    await expect(service.findByProject('p1', {} as any)).rejects.toBeInstanceOf(BadRequestException);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('finds one notification', async () => {
    const { service, notificationsRepository } = setup();
    notificationsRepository.findOneOrFail.mockResolvedValue({ id: 'n1' });
    await expect(service.findOne('n1')).resolves.toEqual({ id: 'n1' });
  });

  it('throws on findOne failure', async () => {
    const { service, notificationsRepository } = setup();
    notificationsRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.findOne('n1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates notification', async () => {
    const { service, notificationsRepository } = setup();
    const existing = { id: 'n1', title: 'old' };
    jest.spyOn(service, 'findOne').mockResolvedValue(existing as any);
    notificationsRepository.save.mockResolvedValue({ id: 'n1' });
    await expect(service.update('n1', { title: 'new' } as any)).resolves.toEqual(existing);
    expect(notificationsRepository.merge).toHaveBeenCalledWith(existing, { title: 'new' });
  });

  it('throws on update failure', async () => {
    const { service } = setup();
    jest.spyOn(service, 'findOne').mockRejectedValue(new Error('bad'));
    await expect(service.update('n1', {} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('soft deletes notification', async () => {
    const { service, notificationsRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'n1' } as any);
    notificationsRepository.softDelete.mockResolvedValue(undefined);
    await expect(service.remove('n1')).resolves.toBeUndefined();
    expect(notificationsRepository.softDelete).toHaveBeenCalledWith('n1');
  });

  it('throws on remove failure', async () => {
    const { service } = setup();
    jest.spyOn(service, 'findOne').mockRejectedValue(new Error('bad'));
    await expect(service.remove('n1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
