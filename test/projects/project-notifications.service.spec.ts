import { ProjectNotificationService } from '@/modules/projects/services/project-notifications.service';
import { BadRequestException } from '@nestjs/common';

describe('ProjectNotificationService', () => {
  const setup = () => {
    const notificationsService = {
      create: jest.fn(),
      findOne: jest.fn(),
      send: jest.fn(),
      sendProjectReportToStaff: jest.fn()
    } as any;
    const projectsService = { findOne: jest.fn() } as any;
    const participationService = {
      findByPhase: jest.fn(),
      findByProject: jest.fn()
    } as any;
    const mentorsService = { findUsersByPhase: jest.fn() } as any;
    const usersService = { findStaff: jest.fn() } as any;
    const eventEmitter = { emit: jest.fn() } as any;
    const service = new ProjectNotificationService(
      notificationsService,
      projectsService,
      participationService,
      mentorsService,
      usersService,
      eventEmitter
    );
    return {
      service,
      notificationsService,
      projectsService,
      participationService,
      mentorsService,
      usersService,
      eventEmitter
    };
  };

  it('creates a project notification', async () => {
    const { service, projectsService, notificationsService } = setup();
    projectsService.findOne.mockResolvedValue({ id: 'p1' });
    notificationsService.create.mockResolvedValue({ id: 'n1' });
    notificationsService.findOne.mockResolvedValue({ id: 'n1' });
    await expect(service.create('p1', { id: 'u1' } as any, { title: 'hello' } as any)).resolves.toEqual({ id: 'n1' });
  });

  it('throws on create failure', async () => {
    const { service, projectsService } = setup();
    projectsService.findOne.mockRejectedValue(new Error('bad'));
    await expect(service.create('p1', { id: 'u1' } as any, {} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sends notification to staff when notify_staff is true', async () => {
    const { service, notificationsService, usersService, eventEmitter } = setup();
    notificationsService.findOne.mockResolvedValue({
      id: 'n1',
      notify_staff: true,
      notify_mentors: true,
      phase: { id: 'phase-1' },
      project: { id: 'p1' }
    });
    usersService.findStaff.mockResolvedValue([{ id: 'u-staff' }]);
    notificationsService.send.mockResolvedValue({ id: 'n1', status: 'sent' });
    await expect(service.send('n1')).resolves.toEqual({ id: 'n1', status: 'sent' });
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'notify.participants',
      [{ id: 'u-staff' }],
      expect.objectContaining({ id: 'n1' })
    );
  });

  it('sends notification to mentors when notify_mentors is true', async () => {
    const { service, notificationsService, mentorsService, eventEmitter } = setup();
    notificationsService.findOne.mockResolvedValue({
      id: 'n1',
      notify_mentors: true,
      phase: { id: 'phase-1' },
      project: { id: 'p1' }
    });
    mentorsService.findUsersByPhase.mockResolvedValue([{ id: 'u-mentor' }]);
    notificationsService.send.mockResolvedValue({ id: 'n1', status: 'sent' });
    await expect(service.send('n1')).resolves.toEqual({ id: 'n1', status: 'sent' });
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'notify.participants',
      [{ id: 'u-mentor' }],
      expect.objectContaining({ id: 'n1' })
    );
  });

  it('sends notification to phase participants when phase exists', async () => {
    const { service, notificationsService, participationService, eventEmitter } = setup();
    notificationsService.findOne.mockResolvedValue({
      id: 'n1',
      notify_mentors: false,
      phase: { id: 'phase-1' },
      project: { id: 'p1' }
    });
    participationService.findByPhase.mockResolvedValue([{ id: 'u-phase' }]);
    notificationsService.send.mockResolvedValue({ id: 'n1', status: 'sent' });
    await service.send('n1');
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'notify.participants',
      [{ id: 'u-phase' }],
      expect.objectContaining({ id: 'n1' })
    );
  });

  it('sends notification to project participants when no phase', async () => {
    const { service, notificationsService, participationService, eventEmitter } = setup();
    notificationsService.findOne.mockResolvedValue({
      id: 'n1',
      notify_mentors: false,
      phase: null,
      project: { id: 'p1' }
    });
    participationService.findByProject.mockResolvedValue([{ id: 'u-project' }]);
    notificationsService.send.mockResolvedValue({ id: 'n1', status: 'sent' });
    await service.send('n1');
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'notify.participants',
      [{ id: 'u-project' }],
      expect.objectContaining({ id: 'n1' })
    );
  });

  it('throws on send failure', async () => {
    const { service, notificationsService } = setup();
    notificationsService.findOne.mockRejectedValue(new Error('bad'));
    await expect(service.send('n1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
