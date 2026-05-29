import { StatsService } from '@/modules/stats/services/stats.service';
import { EventParticipation } from '@/modules/events/events/entities/event-participation.entity';
import { Event } from '@/modules/events/events/entities/event.entity';
import { Program } from '@/modules/programs/programs/entities/program.entity';
import { ProjectParticipation } from '@/modules/projects/projects/entities/project-participation.entity';
import { Project } from '@/modules/projects/projects/entities/project.entity';
import { User } from '@/modules/identity/users/entities/user.entity';
import { Venture } from '@/modules/ventures/ventures/entities/venture.entity';

const makeCountQb = (count: number) => ({
  where: jest.fn().mockReturnThis(),
  getCount: jest.fn().mockResolvedValue(count)
});

const makeRawQb = (rows: any[]) => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  getRawMany: jest.fn().mockResolvedValue(rows)
});

describe('StatsService', () => {
  const setup = () => {
    const userRepo = { count: jest.fn() } as any;
    const ventureRepo = { count: jest.fn() } as any;
    const projectRepo = { count: jest.fn() } as any;
    const eventRepo = { count: jest.fn() } as any;
    const programRepo = { find: jest.fn() } as any;

    const projectParticipationCountQb = makeCountQb(0);
    const eventParticipationCountQb = makeCountQb(0);
    const projectParticipationRawQb = makeRawQb([]);
    const eventParticipationRawQb = makeRawQb([]);

    const projectParticipationRepo = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(projectParticipationCountQb)
        .mockReturnValueOnce(projectParticipationRawQb)
    } as any;
    const eventParticipationRepo = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(eventParticipationCountQb)
        .mockReturnValueOnce(eventParticipationRawQb)
    } as any;

    const repoMap = new Map<any, any>([
      [User, userRepo],
      [Venture, ventureRepo],
      [Project, projectRepo],
      [Event, eventRepo],
      [Program, programRepo],
      [ProjectParticipation, projectParticipationRepo],
      [EventParticipation, eventParticipationRepo]
    ]);

    const dataSource = {
      getRepository: jest.fn((entity: any) => repoMap.get(entity))
    } as any;

    const service = new StatsService(dataSource);

    return {
      service,
      dataSource,
      userRepo,
      ventureRepo,
      projectRepo,
      eventRepo,
      programRepo,
      projectParticipationRepo,
      eventParticipationRepo,
      projectParticipationCountQb,
      eventParticipationCountQb,
      projectParticipationRawQb,
      eventParticipationRawQb
    };
  };

  it('returns user stats', async () => {
    const { service, ventureRepo, userRepo } = setup();
    ventureRepo.count.mockResolvedValue(2);
    userRepo.count.mockResolvedValue(5);
    await expect(service.findUserStats({ id: 'u1' } as any)).resolves.toEqual({ totalVentures: 2, referralsCount: 5 });
  });

  it('returns admin general stats', async () => {
    const { service, userRepo, projectRepo, eventRepo, ventureRepo } = setup();
    userRepo.count.mockResolvedValue(10);
    projectRepo.count.mockResolvedValue(7);
    eventRepo.count.mockResolvedValue(4);
    ventureRepo.count.mockResolvedValue(3);
    await expect(service.findAdminStatsGeneral()).resolves.toEqual({
      totalUsers: 10,
      totalProjects: 7,
      totalEvents: 4,
      totalVentures: 3
    });
  });

  it('returns admin year stats with detailed participation tree', async () => {
    const {
      service,
      programRepo,
      projectParticipationCountQb,
      eventParticipationCountQb,
      projectParticipationRawQb,
      eventParticipationRawQb
    } = setup();

    projectParticipationCountQb.getCount.mockResolvedValue(4);
    eventParticipationCountQb.getCount.mockResolvedValue(3);
    projectParticipationRawQb.getRawMany.mockResolvedValue([{ projectId: 'proj1', count: '4' }]);
    eventParticipationRawQb.getRawMany.mockResolvedValue([{ eventId: 'evt1', count: '3' }]);
    programRepo.find.mockResolvedValue([
      {
        id: 'prog1',
        name: 'Program 1',
        subprograms: [
          {
            id: 'sub1',
            name: 'Sub 1',
            projects: [{ id: 'proj1', name: 'Project 1' }],
            events: [{ id: 'evt1', name: 'Event 1' }]
          }
        ]
      }
    ]);

    await expect(service.findAdminStatsByYear(2026)).resolves.toEqual({
      year: 2026,
      summary: {
        totalProjectParticipations: 4,
        totalEventParticipations: 3,
        totalParticipations: 7
      },
      detailedParticipations: {
        programs: [
          {
            id: 'prog1',
            name: 'Program 1',
            participations: 7,
            subprograms: [
              {
                id: 'sub1',
                name: 'Sub 1',
                participations: 7,
                projects: [{ id: 'proj1', name: 'Project 1', participations: 4 }],
                events: [{ id: 'evt1', name: 'Event 1', participations: 3 }]
              }
            ]
          }
        ]
      }
    });
  });

  it('defaults to zero participation counts when no rows are found', async () => {
    const {
      service,
      programRepo,
      projectParticipationCountQb,
      eventParticipationCountQb,
      projectParticipationRawQb,
      eventParticipationRawQb
    } = setup();

    projectParticipationCountQb.getCount.mockResolvedValue(0);
    eventParticipationCountQb.getCount.mockResolvedValue(0);
    projectParticipationRawQb.getRawMany.mockResolvedValue([]);
    eventParticipationRawQb.getRawMany.mockResolvedValue([]);
    programRepo.find.mockResolvedValue([
      {
        id: 'prog1',
        name: 'Program 1',
        subprograms: [
          {
            id: 'sub1',
            name: 'Sub 1',
            projects: [{ id: 'proj-missing', name: 'Project Missing' }],
            events: [{ id: 'evt-missing', name: 'Event Missing' }]
          }
        ]
      }
    ]);

    const result = await service.findAdminStatsByYear(2026);
    expect(result.summary).toEqual({
      totalProjectParticipations: 0,
      totalEventParticipations: 0,
      totalParticipations: 0
    });
    expect(result.detailedParticipations.programs[0].participations).toBe(0);
    expect(result.detailedParticipations.programs[0].subprograms[0].projects[0].participations).toBe(0);
    expect(result.detailedParticipations.programs[0].subprograms[0].events[0].participations).toBe(0);
  });
});
