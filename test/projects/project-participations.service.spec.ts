import { BadRequestException } from '@nestjs/common';
import { parseUsersCsv } from '@/core/helpers/user-csv.helper';
import { ProjectParticipationService } from '@/modules/projects/services/project-participations.service';

jest.mock('@/core/helpers/user-csv.helper', () => ({
  parseUsersCsv: jest.fn()
}));

const makeQueryBuilder = (result: [any[], number] = [[], 0], entity: any = { id: 'pp1' }) => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  loadRelationCountAndMap: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  distinct: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue(result),
  getOneOrFail: jest.fn().mockResolvedValue(entity)
});

describe('ProjectParticipationService', () => {
  const setup = () => {
    const queryBuilder = makeQueryBuilder([[{ id: 'pp1' }], 1], {
      id: 'pp1',
      user: { id: 'participant-1', email: 'participant@example.com', name: 'Participant' },
      project: { id: 'project-1', name: 'Project 1' },
      phases: [{ id: 'phase-1' }, { id: 'phase-2' }],
      reviews: [{ id: 'r1', score: 80, phase: { id: 'phase-1' } }]
    });
    const participationRepository = {
      find: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder)
    } as any;
    const upvoteRepository = {
      save: jest.fn(),
      findOneOrFail: jest.fn(),
      remove: jest.fn()
    } as any;
    const reviewRepository = {
      delete: jest.fn()
    } as any;
    const usersService = { findOrCreate: jest.fn() } as any;
    const phasesService = { findOne: jest.fn() } as any;
    const venturesService = { findOne: jest.fn() } as any;
    const projectsService = {
      findOne: jest.fn(),
      findOneWithParticipations: jest.fn()
    } as any;

    const service = new ProjectParticipationService(
      participationRepository,
      upvoteRepository,
      reviewRepository,
      usersService,
      phasesService,
      venturesService,
      projectsService
    );
    return {
      service,
      queryBuilder,
      participationRepository,
      upvoteRepository,
      reviewRepository,
      usersService,
      phasesService,
      venturesService,
      projectsService
    };
  };

  it('finds user participations', async () => {
    const { service, participationRepository } = setup();
    participationRepository.find.mockResolvedValue([{ id: 'pp1' }]);
    await expect(service.findUserParticipations('u1')).resolves.toEqual([{ id: 'pp1' }]);
  });

  it('ensures a participation exists', async () => {
    const { service, participationRepository } = setup();
    participationRepository.findOneOrFail.mockResolvedValue({ id: 'pp1' });

    await expect(service.ensureExists('pp1')).resolves.toBeUndefined();
    expect(participationRepository.findOneOrFail).toHaveBeenCalledWith({ where: { id: 'pp1' } });
  });

  it('throws on findUserParticipations failure', async () => {
    const { service, participationRepository } = setup();
    participationRepository.find.mockRejectedValue(new Error('bad'));
    await expect(service.findUserParticipations('u1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('moves participants to a phase and skips already assigned', async () => {
    const { service, phasesService, participationRepository } = setup();
    phasesService.findOne.mockResolvedValue({ id: 'phase-1' });
    participationRepository.find.mockResolvedValue([
      { id: 'pp1', phases: [] },
      { id: 'pp2', phases: [{ id: 'phase-1' }] }
    ]);
    participationRepository.save.mockResolvedValue(undefined);

    await expect(service.moveParticipants({ ids: ['pp1', 'pp2'], phaseId: 'phase-1' } as any)).resolves.toBeUndefined();
    expect(participationRepository.save).toHaveBeenCalledTimes(1);
    expect(participationRepository.save).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'pp1', phases: [{ id: 'phase-1' }] })
    ]);
  });

  it('removes participants from a phase', async () => {
    const { service, participationRepository, reviewRepository } = setup();
    participationRepository.find.mockResolvedValue([{ id: 'pp1', phases: [{ id: 'phase-1' }, { id: 'phase-2' }] }]);
    participationRepository.save.mockResolvedValue(undefined);
    reviewRepository.delete.mockResolvedValue(undefined);

    await expect(
      service.removeParticipantsFromPhase({ ids: ['pp1'], phaseId: 'phase-1' } as any)
    ).resolves.toBeUndefined();
    expect(participationRepository.save).toHaveBeenCalledWith([
      expect.objectContaining({ phases: [{ id: 'phase-2' }] })
    ]);
    expect(reviewRepository.delete).toHaveBeenCalledTimes(1);
  });

  it('finds participations by project', async () => {
    const { service, queryBuilder } = setup();
    await expect(service.findParticipations('project-1', {} as any)).resolves.toEqual([[{ id: 'pp1' }], 1]);
    expect(queryBuilder.where).toHaveBeenCalledWith('pp.projectId = :projectId', { projectId: 'project-1' });
    expect(queryBuilder.loadRelationCountAndMap).toHaveBeenCalledWith('pp.upvotesCount', 'pp.upvotes');
    expect(queryBuilder.distinct).toHaveBeenCalledWith(true);
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(20);
  });

  it('applies search and pagination when finding participations', async () => {
    const { service, queryBuilder } = setup();
    await expect(service.findParticipations('project-1', { page: 3, q: '  alice  ' } as any)).resolves.toEqual([
      [{ id: 'pp1' }],
      1
    ]);
    expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('user.name LIKE :q OR user.email LIKE :q', {
      q: '%  alice  %'
    });
    expect(queryBuilder.skip).toHaveBeenCalledWith(40);
  });

  it('applies search when q is whitespace-only', async () => {
    const { service, queryBuilder } = setup();
    await expect(service.findParticipations('project-1', { q: '   ' } as any)).resolves.toEqual([[{ id: 'pp1' }], 1]);
    expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('user.name LIKE :q OR user.email LIKE :q', {
      q: '%   %'
    });
  });

  it('does not apply search when q is an empty string', async () => {
    const { service, queryBuilder } = setup();
    await expect(service.findParticipations('project-1', { q: '' } as any)).resolves.toEqual([[{ id: 'pp1' }], 1]);
    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
  });

  it('applies phase filter when phaseId is provided', async () => {
    const { service, queryBuilder } = setup();
    await expect(service.findParticipations('project-1', { phaseId: 'phase-1' } as any)).resolves.toEqual([
      [{ id: 'pp1' }],
      1
    ]);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('phases.id = :phaseId', { phaseId: 'phase-1' });
  });

  it('does not apply phase filter when phaseId is an empty string', async () => {
    const { service, queryBuilder } = setup();
    await expect(service.findParticipations('project-1', { phaseId: '' } as any)).resolves.toEqual([
      [{ id: 'pp1' }],
      1
    ]);
    expect(queryBuilder.andWhere).not.toHaveBeenCalledWith('phases.id = :phaseId', expect.anything());
  });

  it('finds unique users by project', async () => {
    const { service, projectsService, participationRepository } = setup();
    projectsService.findOne.mockResolvedValue({ id: 'project-1' });
    participationRepository.find.mockResolvedValue([
      { user: { id: 'u1' } },
      { user: { id: 'u1' } },
      { user: { id: 'u2' } }
    ]);

    await expect(service.findByProject('project-1')).resolves.toEqual([{ id: 'u1' }, { id: 'u2' }]);
  });

  it('finds unique users by phase', async () => {
    const { service, participationRepository } = setup();
    participationRepository.find.mockResolvedValue([
      { user: { id: 'u1' } },
      { user: { id: 'u1' } },
      { user: { id: 'u3' } }
    ]);
    await expect(service.findByPhase('phase-1')).resolves.toEqual([{ id: 'u1' }, { id: 'u3' }]);
  });

  it('imports participants from csv and saves only new users', async () => {
    const { service, projectsService, usersService, participationRepository } = setup();
    projectsService.findOneWithParticipations.mockResolvedValue({
      id: 'project-1',
      started_at: new Date('2026-01-01'),
      participations: [{ user: { id: 'u-existing' } }]
    });
    (parseUsersCsv as jest.Mock).mockResolvedValue([{ email: 'a@x.com' }, { email: 'b@x.com' }]);
    usersService.findOrCreate.mockResolvedValueOnce({ id: 'u-existing' }).mockResolvedValueOnce({ id: 'u-new' });
    participationRepository.save.mockResolvedValue(undefined);

    await expect(
      service.importParticipants('project-1', { buffer: Buffer.from('csv') } as any)
    ).resolves.toBeUndefined();
    expect(participationRepository.save).toHaveBeenCalledWith([
      expect.objectContaining({
        user: { id: 'u-new' },
        project: { id: 'project-1' }
      })
    ]);
  });

  it('does not save when imported users are all existing', async () => {
    const { service, projectsService, usersService, participationRepository } = setup();
    projectsService.findOneWithParticipations.mockResolvedValue({
      id: 'project-1',
      started_at: new Date('2026-01-01'),
      participations: [{ user: { id: 'u1' } }]
    });
    (parseUsersCsv as jest.Mock).mockResolvedValue([{ email: 'a@x.com' }]);
    usersService.findOrCreate.mockResolvedValue({ id: 'u1' });

    await expect(
      service.importParticipants('project-1', { buffer: Buffer.from('csv') } as any)
    ).resolves.toBeUndefined();
    expect(participationRepository.save).not.toHaveBeenCalled();
  });

  it('participates in a project', async () => {
    const { service, projectsService, venturesService, participationRepository } = setup();
    projectsService.findOne.mockResolvedValue({ id: 'project-1' });
    venturesService.findOne.mockResolvedValue({ id: 'venture-1' });
    participationRepository.save.mockResolvedValue(undefined);

    await expect(
      service.participate('project-1', { id: 'u1' } as any, { ventureId: 'venture-1' } as any)
    ).resolves.toBeUndefined();
    expect(participationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        user: { id: 'u1' },
        project: { id: 'project-1' },
        venture: { id: 'venture-1' }
      })
    );
  });

  it('upvotes a participation', async () => {
    const { service, upvoteRepository } = setup();
    upvoteRepository.save.mockResolvedValue(undefined);
    await expect(service.upvote('pp1', 'u1')).resolves.toBeUndefined();
    expect(upvoteRepository.save).toHaveBeenCalledWith({ participation: { id: 'pp1' }, user: { id: 'u1' } });
  });

  it('unvotes a participation', async () => {
    const { service, upvoteRepository } = setup();
    upvoteRepository.findOneOrFail.mockResolvedValue({ id: 'vote-1' });
    upvoteRepository.remove.mockResolvedValue(undefined);
    await expect(service.unvote('pp1', 'u1')).resolves.toBeUndefined();
    expect(upvoteRepository.remove).toHaveBeenCalledWith({ id: 'vote-1' });
  });

  it('throws on internal failures', async () => {
    const { service, queryBuilder, upvoteRepository } = setup();
    queryBuilder.getManyAndCount.mockRejectedValue(new Error('bad'));
    await expect(service.findParticipations('project-1', {} as any)).rejects.toBeInstanceOf(BadRequestException);

    upvoteRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.unvote('pp1', 'u1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
