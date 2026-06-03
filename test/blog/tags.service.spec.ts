import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TagsService } from '@/modules/content/blog/tags/services/tags.service';

const makeTagQueryBuilder = (result: [any[], number] = [[], 0]) => ({
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue(result)
});

describe('TagsService', () => {
  const setup = () => {
    const queryBuilder = makeTagQueryBuilder([[{ id: 't1' }], 1]);
    const tagRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOneOrFail: jest.fn(),
      merge: jest.fn((entity, dto) => ({ ...entity, ...dto })),
      delete: jest.fn()
    } as any;
    const service = new TagsService(tagRepository);
    return { service, tagRepository, queryBuilder };
  };

  it('creates a tag', async () => {
    const { service, tagRepository } = setup();
    tagRepository.create.mockReturnValue({ name: 'x' });
    tagRepository.save.mockResolvedValue({ id: 't1', name: 'x' });
    await expect(service.create({ name: 'x' } as any)).resolves.toEqual({ id: 't1', name: 'x' });
  });

  it('throws bad request on create failure', async () => {
    const { service, tagRepository } = setup();
    tagRepository.create.mockImplementation(() => {
      throw new Error('bad');
    });
    await expect(service.create({ name: 'x' } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds all tags', async () => {
    const { service, tagRepository } = setup();
    tagRepository.find.mockResolvedValue([{ id: 't1' }]);
    await expect(service.findAll()).resolves.toEqual([{ id: 't1' }]);
  });

  it('filters with q and page', async () => {
    const { service, queryBuilder } = setup();
    await expect(service.findFiltered({ q: 'js', page: 2 } as any)).resolves.toEqual([[{ id: 't1' }], 1]);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('t.name LIKE :search', { search: '%js%' });
    expect(queryBuilder.skip).toHaveBeenCalledWith(10);
    expect(queryBuilder.take).toHaveBeenCalledWith(10);
  });

  it('filters without q/page', async () => {
    const { service, queryBuilder } = setup();
    await service.findFiltered({} as any);
    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(10);
  });

  it('applies page window even without search query', async () => {
    const { service, queryBuilder } = setup();

    await service.findFiltered({ page: 3 } as any);
    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    expect(queryBuilder.skip).toHaveBeenCalledWith(20);
    expect(queryBuilder.take).toHaveBeenCalledWith(10);
  });

  it('finds one tag', async () => {
    const { service, tagRepository } = setup();
    tagRepository.findOneOrFail.mockResolvedValue({ id: 't1' });
    await expect(service.findOne('t1')).resolves.toEqual({ id: 't1' });
  });

  it('throws not found on findOne failure', async () => {
    const { service, tagRepository } = setup();
    tagRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.findOne('t1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates a tag', async () => {
    const { service, tagRepository } = setup();
    tagRepository.findOneOrFail.mockResolvedValue({ id: 't1', name: 'old' });
    tagRepository.save.mockResolvedValue({ id: 't1', name: 'updated' });
    await expect(service.update('t1', { name: 'updated' } as any)).resolves.toEqual({ id: 't1', name: 'updated' });
  });

  it('throws bad request on update failure', async () => {
    const { service, tagRepository } = setup();
    tagRepository.findOneOrFail.mockResolvedValue({ id: 't1' });
    tagRepository.save.mockRejectedValue(new Error('bad'));
    await expect(service.update('t1', {} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('removes a tag', async () => {
    const { service, tagRepository } = setup();
    tagRepository.delete.mockResolvedValue(undefined);
    await expect(service.remove('t1')).resolves.toBeUndefined();
    expect(tagRepository.delete).toHaveBeenCalledWith('t1');
  });

  it('throws bad request on remove failure', async () => {
    const { service, tagRepository } = setup();
    tagRepository.delete.mockRejectedValue(new Error('bad'));
    await expect(service.remove('t1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
