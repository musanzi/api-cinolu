import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from '../../src/modules/projects/projects/services/projects.service';

const makeQueryBuilder = (result: [any[], number] = [[], 0]) => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  loadRelationCountAndMap: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue(result),
  getOneOrFail: jest.fn()
});

describe('ProjectsService', () => {
  const setup = () => {
    const queryBuilder = makeQueryBuilder([[{ id: 'p1' }], 1]);
    const projectRepository = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      find: jest.fn(),
      findOneOrFail: jest.fn(),
      softDelete: jest.fn()
    } as any;
    const service = new ProjectsService(projectRepository);
    return { service, projectRepository, queryBuilder };
  };

  it('creates project', async () => {
    const { service, projectRepository } = setup();
    projectRepository.create.mockReturnValue({ name: 'p' });
    projectRepository.save.mockResolvedValue({ id: 'p1' });
    await expect(
      service.create({ project_manager: 'u1', program: 'pr1', categories: ['c1'], name: 'x' } as any)
    ).resolves.toEqual({ id: 'p1' });
  });

  it('throws on create failure', async () => {
    const { service, projectRepository } = setup();
    projectRepository.create.mockImplementation(() => {
      throw new Error('bad');
    });
    await expect(service.create({ categories: [] } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds all with filter and category as string', async () => {
    const { service, queryBuilder } = setup();
    await expect(
      service.findAll({ page: 2, categories: 'c1', q: 'search', filter: 'published' } as any)
    ).resolves.toEqual([[{ id: 'p1' }], 1]);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('p.is_published = :isPublished', { isPublished: true });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('categories.id IN (:...categoryIds)', { categoryIds: ['c1'] });
    expect(queryBuilder.skip).toHaveBeenCalledWith(20);
  });

  it('supports drafts and highlighted filters', async () => {
    const { service, queryBuilder } = setup();
    await service.findAll({ filter: 'drafts' } as any);
    await service.findAll({ filter: 'highlighted' } as any);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('p.is_published = :isPublished', { isPublished: false });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('p.is_highlighted = :isHighlighted', { isHighlighted: true });
  });

  it('throws on findAll failure', async () => {
    const { service, projectRepository, queryBuilder } = setup();
    queryBuilder.getManyAndCount.mockRejectedValue(new Error('bad'));
    projectRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    await expect(service.findAll({} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds published with status filters', async () => {
    const { service, queryBuilder } = setup();
    await expect(
      service.findPublished({ page: 1, status: 'past', categories: ['c1'], q: 'abc' } as any)
    ).resolves.toEqual([[{ id: 'p1' }], 1]);
    await service.findPublished({ status: 'current' } as any);
    await service.findPublished({ status: 'future' } as any);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('p.ended_at < NOW()');
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('p.started_at <= NOW() AND p.ended_at >= NOW()');
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('p.started_at > NOW()');
  });

  it('throws on findPublished failure', async () => {
    const { service, queryBuilder } = setup();
    queryBuilder.getManyAndCount.mockRejectedValue(new Error('bad'));
    await expect(service.findPublished({} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds recent projects', async () => {
    const { service, projectRepository } = setup();
    projectRepository.find.mockResolvedValue([{ id: 'p1' }]);
    await expect(service.findRecent()).resolves.toEqual([{ id: 'p1' }]);
  });

  it('throws on recent failure', async () => {
    const { service, projectRepository } = setup();
    projectRepository.find.mockRejectedValue(new Error('bad'));
    await expect(service.findRecent()).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds by slug', async () => {
    const { service, queryBuilder } = setup();
    queryBuilder.getOneOrFail.mockResolvedValue({ id: 'p1' });
    await expect(service.findBySlug('slug')).resolves.toEqual({ id: 'p1' });
  });

  it('throws on missing slug', async () => {
    const { service, queryBuilder } = setup();
    queryBuilder.getOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.findBySlug('slug')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('finds one by id', async () => {
    const { service, projectRepository } = setup();
    projectRepository.findOneOrFail.mockResolvedValue({ id: 'p1' });
    await expect(service.findOne('p1')).resolves.toEqual({ id: 'p1' });
  });

  it('finds one with participations', async () => {
    const { service, projectRepository } = setup();
    projectRepository.findOneOrFail.mockResolvedValue({ id: 'p1' });
    await expect(service.findOneWithParticipations('p1')).resolves.toEqual({ id: 'p1' });
  });

  it('throws not found on missing id', async () => {
    const { service, projectRepository } = setup();
    projectRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.findOne('p1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('toggles highlight', async () => {
    const { service, projectRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'p1', is_highlighted: false } as any);
    projectRepository.save.mockResolvedValue({ id: 'p1', is_highlighted: true });
    await expect(service.toggleHighlight('p1')).resolves.toEqual({ id: 'p1', is_highlighted: true });
  });

  it('throws on toggleHighlight failure', async () => {
    const { service } = setup();
    jest.spyOn(service, 'findOne').mockRejectedValue(new Error('bad'));
    await expect(service.toggleHighlight('p1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('toggles publish', async () => {
    const { service, projectRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'p1', is_published: false } as any);
    projectRepository.save.mockResolvedValue({ id: 'p1', is_published: true });
    await expect(service.togglePublish('p1')).resolves.toEqual({ id: 'p1', is_published: true });
  });

  it('adds cover', async () => {
    const { service, projectRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'p1' } as any);
    projectRepository.save.mockResolvedValue({ id: 'p1', cover: 'c.png' });
    await expect(service.addCover('p1', 'c.png')).resolves.toEqual({ id: 'p1', cover: 'c.png' });
  });

  it('updates project', async () => {
    const { service, projectRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'p1',
      project_manager: { id: 'u-old' },
      program: { id: 'pr-old' },
      categories: [{ id: 'c-old' }]
    } as any);
    projectRepository.save.mockResolvedValue({ id: 'p1', name: 'updated' });
    await expect(service.update('p1', { name: 'updated', categories: ['c1'] } as any)).resolves.toEqual({
      id: 'p1',
      name: 'updated'
    });
  });

  it('throws on update failure', async () => {
    const { service } = setup();
    jest.spyOn(service, 'findOne').mockRejectedValue(new Error('bad'));
    await expect(service.update('p1', {} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('soft deletes project', async () => {
    const { service, projectRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'p1' } as any);
    projectRepository.softDelete.mockResolvedValue(undefined);
    await expect(service.remove('p1')).resolves.toBeUndefined();
    expect(projectRepository.softDelete).toHaveBeenCalledWith('p1');
  });

  it('throws on remove failure', async () => {
    const { service } = setup();
    jest.spyOn(service, 'findOne').mockRejectedValue(new Error('bad'));
    await expect(service.remove('p1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
