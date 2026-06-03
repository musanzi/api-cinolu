import { BadRequestException, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { OpportunitiesService } from '@/modules/opportunities/services/opportunities.service';
import { OpportunityLanguage } from '@/modules/opportunities/entities/opportunity.entity';

describe('OpportunitiesService', () => {
  let unlinkSpy: jest.SpiedFunction<typeof fs.unlink>;

  const setup = () => {
    const opportunitiesRepository = {
      create: jest.fn((dto) => dto),
      save: jest.fn(),
      find: jest.fn(),
      findOneOrFail: jest.fn(),
      merge: jest.fn((entity, dto) => ({ ...entity, ...dto })),
      delete: jest.fn()
    } as any;
    const service = new OpportunitiesService(opportunitiesRepository);
    return { service, opportunitiesRepository };
  };

  beforeEach(() => {
    unlinkSpy = jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
  });

  afterEach(() => {
    unlinkSpy.mockRestore();
  });

  it('creates an opportunity', async () => {
    const { service, opportunitiesRepository } = setup();
    opportunitiesRepository.save.mockResolvedValue({ id: 'o1' });
    await expect(
      service.create({
        title: 'Bourse',
        description: 'Desc',
        due_date: '2026-05-01',
        link: 'https://cinolu.org',
        language: OpportunityLanguage.FR
      })
    ).resolves.toEqual({ id: 'o1' });
  });

  it('throws on create failure', async () => {
    const { service, opportunitiesRepository } = setup();
    opportunitiesRepository.save.mockRejectedValue(new Error('bad'));
    await expect(service.create({} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds all ordered with filters', async () => {
    const { service, opportunitiesRepository } = setup();
    opportunitiesRepository.find.mockResolvedValue([{ id: 'o1' }]);
    await expect(
      service.findAll({
        from: '2026-05-01',
        to: '2026-06-01',
        language: OpportunityLanguage.EN
      })
    ).resolves.toEqual([{ id: 'o1' }]);
    expect(opportunitiesRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { due_date: 'ASC' },
        where: expect.objectContaining({ language: OpportunityLanguage.EN, due_date: expect.anything() })
      })
    );
  });

  it('supports one-sided date filters', async () => {
    const { service, opportunitiesRepository } = setup();
    opportunitiesRepository.find.mockResolvedValue([]);
    await service.findAll({ from: '2026-05-01' });
    await service.findAll({ to: '2026-06-01' });
    expect(opportunitiesRepository.find).toHaveBeenCalledTimes(2);
  });

  it('throws on findAll failure', async () => {
    const { service, opportunitiesRepository } = setup();
    opportunitiesRepository.find.mockRejectedValue(new Error('bad'));
    await expect(service.findAll({})).rejects.toThrow('bad');
  });

  it('finds one opportunity by slug', async () => {
    const { service, opportunitiesRepository } = setup();
    opportunitiesRepository.findOneOrFail.mockResolvedValue({ id: 'o1', slug: 'appel' });
    await expect(service.findOne('appel')).resolves.toEqual({ id: 'o1', slug: 'appel' });
    expect(opportunitiesRepository.findOneOrFail).toHaveBeenCalledWith({
      where: { slug: 'appel' }
    });
  });

  it('throws when opportunity is missing', async () => {
    const { service, opportunitiesRepository } = setup();
    opportunitiesRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.findOne('appel')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('finds one opportunity by id', async () => {
    const { service, opportunitiesRepository } = setup();
    opportunitiesRepository.findOneOrFail.mockResolvedValue({ id: 'o1' });
    await expect(service.findOneById('o1')).resolves.toEqual({ id: 'o1' });
    expect(opportunitiesRepository.findOneOrFail).toHaveBeenCalledWith({
      where: { id: 'o1' }
    });
  });

  it('updates an opportunity', async () => {
    const { service, opportunitiesRepository } = setup();
    opportunitiesRepository.findOneOrFail.mockResolvedValue({ id: 'o1', title: 'Old' });
    opportunitiesRepository.save.mockResolvedValue({ id: 'o1', title: 'New' });
    await expect(service.update('o1', { title: 'New' })).resolves.toEqual({ id: 'o1', title: 'New' });
  });

  it('adds cover', async () => {
    const { service, opportunitiesRepository } = setup();
    opportunitiesRepository.findOneOrFail.mockResolvedValue({ id: 'o1', cover: null });
    opportunitiesRepository.save.mockResolvedValue({ id: 'o1', cover: 'cover.png' });
    await expect(service.addCover('o1', 'cover.png')).resolves.toEqual({ id: 'o1', cover: 'cover.png' });
    expect(unlinkSpy).not.toHaveBeenCalled();
  });

  it('replaces the old cover', async () => {
    const { service, opportunitiesRepository } = setup();
    opportunitiesRepository.findOneOrFail.mockResolvedValue({ id: 'o1', cover: 'old.png' });
    opportunitiesRepository.save.mockResolvedValue({ id: 'o1', cover: 'new.png' });
    await expect(service.addCover('o1', 'new.png')).resolves.toEqual({ id: 'o1', cover: 'new.png' });
    expect(unlinkSpy).toHaveBeenCalledWith('./uploads/opportunities/old.png');
  });

  it('removes an opportunity', async () => {
    const { service, opportunitiesRepository } = setup();
    opportunitiesRepository.delete.mockResolvedValue(undefined);
    await expect(service.remove('o1')).resolves.toBeUndefined();
    expect(opportunitiesRepository.delete).toHaveBeenCalledWith('o1');
  });

  it('throws on remove failure', async () => {
    const { service, opportunitiesRepository } = setup();
    opportunitiesRepository.delete.mockRejectedValue(new Error('bad'));
    await expect(service.remove('o1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
