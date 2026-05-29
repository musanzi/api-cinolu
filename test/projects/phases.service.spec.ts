import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PhasesService } from '@/modules/projects/phases/services/phases.service';

describe('PhasesService', () => {
  const setup = () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      loadRelationCountAndMap: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: 'ph1' }])
    };
    const phaseRepository = {
      save: jest.fn(),
      findOneOrFail: jest.fn(),
      find: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder)
    } as any;
    const deliverablesService = {
      create: jest.fn(),
      sync: jest.fn()
    } as any;
    const service = new PhasesService(phaseRepository, deliverablesService);
    return { service, phaseRepository, deliverablesService, queryBuilder };
  };

  it('creates phase and deliverables', async () => {
    const { service, phaseRepository, deliverablesService } = setup();
    phaseRepository.save.mockResolvedValue({ id: 'ph1' });
    deliverablesService.create.mockResolvedValue(undefined);
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'ph1' } as any);

    await expect(
      service.create('project-1', { name: 'Phase', deliverables: [{ title: 'D' }], mentors: ['m1'] } as any)
    ).resolves.toEqual({ id: 'ph1' });
  });

  it('throws on create failure', async () => {
    const { service, phaseRepository } = setup();
    phaseRepository.save.mockRejectedValue(new Error('bad'));
    await expect(service.create('project-1', {} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds one phase', async () => {
    const { service, phaseRepository } = setup();
    phaseRepository.findOneOrFail.mockResolvedValue({ id: 'ph1' });
    await expect(service.findOne('ph1')).resolves.toEqual({ id: 'ph1' });
  });

  it('throws not found on findOne failure', async () => {
    const { service, phaseRepository } = setup();
    phaseRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.findOne('ph1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates phase and syncs deliverables', async () => {
    const { service, phaseRepository, deliverablesService } = setup();
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValueOnce({ id: 'ph1', mentors: [{ id: 'old' }] } as any)
      .mockResolvedValueOnce({ id: 'ph1', name: 'updated' } as any);
    phaseRepository.save.mockResolvedValue(undefined);
    deliverablesService.sync.mockResolvedValue(undefined);

    await expect(
      service.update('ph1', { name: 'updated', deliverables: [{ title: 'D2' }], mentors: ['m1'] } as any)
    ).resolves.toEqual({ id: 'ph1', name: 'updated' });
  });

  it('throws on update failure', async () => {
    const { service } = setup();
    jest.spyOn(service, 'findOne').mockRejectedValue(new Error('bad'));
    await expect(service.update('ph1', {} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds all phases by project', async () => {
    const { service, queryBuilder } = setup();
    await expect(service.findAll('project-1')).resolves.toEqual([{ id: 'ph1' }]);
    expect(queryBuilder.where).toHaveBeenCalledWith('phase.projectId = :projectId', { projectId: 'project-1' });
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('phase.deliverables', 'deliverables');
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('phase.mentors', 'mentors');
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('mentors.owner', 'owner');
    expect(queryBuilder.loadRelationCountAndMap).toHaveBeenCalledWith(
      'phase.participationsCount',
      'phase.participations'
    );
  });

  it('throws on findAll failure', async () => {
    const { service, queryBuilder } = setup();
    queryBuilder.getMany.mockRejectedValue(new Error('bad'));
    await expect(service.findAll('project-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('removes phase', async () => {
    const { service, phaseRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'ph1' } as any);
    phaseRepository.softDelete.mockResolvedValue(undefined);
    await expect(service.remove('ph1')).resolves.toBeUndefined();
  });
});
