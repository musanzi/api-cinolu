import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VenturesService } from '@/modules/ventures/ventures/services/ventures.service';

const makeQueryBuilder = (result: [any[], number] = [[], 0]) => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue(result)
});

describe('VenturesService', () => {
  const setup = () => {
    const queryBuilder = makeQueryBuilder([[{ id: 'v1' }], 1]);
    const ventureRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOneOrFail: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      softDelete: jest.fn()
    } as any;
    const eventEmitter = { emit: jest.fn() } as any;
    const service = new VenturesService(ventureRepository, eventEmitter);
    return { service, ventureRepository, eventEmitter, queryBuilder };
  };

  it('creates venture and emits created event', async () => {
    const { service, ventureRepository, eventEmitter } = setup();
    ventureRepository.save.mockResolvedValue({ id: 'v1' });
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'v1' } as any);
    await expect(service.create('u1', { name: 'venture' } as any)).resolves.toEqual({ id: 'v1' });
    expect(eventEmitter.emit).toHaveBeenCalledWith('venture.created', { id: 'v1' });
  });

  it('throws on create failure', async () => {
    const { service, ventureRepository } = setup();
    ventureRepository.save.mockRejectedValue(new Error('bad'));
    await expect(service.create('u1', {} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds published ventures', async () => {
    const { service, ventureRepository } = setup();
    ventureRepository.find.mockResolvedValue([{ id: 'v1' }]);
    await expect(service.findPublished()).resolves.toEqual([{ id: 'v1' }]);
  });

  it('throws on findPublished failure', async () => {
    const { service, ventureRepository } = setup();
    ventureRepository.find.mockRejectedValue(new Error('bad'));
    await expect(service.findPublished()).rejects.toBeInstanceOf(NotFoundException);
  });

  it('finds venture by slug', async () => {
    const { service, ventureRepository } = setup();
    ventureRepository.findOneOrFail.mockResolvedValue({ id: 'v1', slug: 'slug' });
    await expect(service.findBySlug('slug')).resolves.toEqual({ id: 'v1', slug: 'slug' });
  });

  it('throws on missing slug', async () => {
    const { service, ventureRepository } = setup();
    ventureRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.findBySlug('slug')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('toggles publish to approved and emits approved event', async () => {
    const { service, ventureRepository, eventEmitter } = setup();
    jest.spyOn(service, 'findBySlug').mockResolvedValue({ id: 'v1', is_published: false } as any);
    ventureRepository.save.mockResolvedValue({ id: 'v1', is_published: true });
    await expect(service.togglePublish('slug')).resolves.toEqual({ id: 'v1', is_published: true });
    expect(eventEmitter.emit).toHaveBeenCalledWith('venture.approved', { id: 'v1', is_published: true });
  });

  it('toggles publish to rejected and emits rejected event', async () => {
    const { service, ventureRepository, eventEmitter } = setup();
    jest.spyOn(service, 'findBySlug').mockResolvedValue({ id: 'v1', is_published: true } as any);
    ventureRepository.save.mockResolvedValue({ id: 'v1', is_published: false });
    await service.togglePublish('slug');
    expect(eventEmitter.emit).toHaveBeenCalledWith('venture.rejected', { id: 'v1', is_published: false });
  });

  it('throws on togglePublish failure', async () => {
    const { service } = setup();
    jest.spyOn(service, 'findBySlug').mockRejectedValue(new Error('bad'));
    await expect(service.togglePublish('slug')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds ventures by user paginated', async () => {
    const { service, ventureRepository } = setup();
    ventureRepository.findAndCount.mockResolvedValue([[{ id: 'v1' }], 1]);
    await expect(service.findByUser('2', 'u1')).resolves.toEqual([[{ id: 'v1' }], 1]);
    expect(ventureRepository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ skip: 40, take: 40 }));
  });

  it('throws on findByUser failure', async () => {
    const { service, ventureRepository } = setup();
    ventureRepository.findAndCount.mockRejectedValue(new Error('bad'));
    await expect(service.findByUser('1', 'u1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('finds ventures by user unpaginated', async () => {
    const { service, ventureRepository } = setup();
    ventureRepository.find.mockResolvedValue([{ id: 'v1' }]);
    await expect(service.findByUserUnpaginated({ id: 'u1' } as any)).resolves.toEqual([{ id: 'v1' }]);
  });

  it('finds all ventures with query', async () => {
    const { service, queryBuilder } = setup();
    await expect(service.findAll({ page: 2, q: 'foo' } as any)).resolves.toEqual([[{ id: 'v1' }], 1]);
    expect(queryBuilder.where).toHaveBeenCalledWith('venture.name LIKE :q OR venture.description LIKE :q', {
      q: '%foo%'
    });
    expect(queryBuilder.skip).toHaveBeenCalledWith(40);
  });

  it('throws on findAll failure', async () => {
    const { service, queryBuilder } = setup();
    queryBuilder.getManyAndCount.mockRejectedValue(new Error('bad'));
    await expect(service.findAll({} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds one venture by id', async () => {
    const { service, ventureRepository } = setup();
    ventureRepository.findOneOrFail.mockResolvedValue({ id: 'v1' });
    await expect(service.findOne('v1')).resolves.toEqual({ id: 'v1' });
  });

  it('updates venture by slug', async () => {
    const { service, ventureRepository } = setup();
    jest.spyOn(service, 'findBySlug').mockResolvedValue({ id: 'v1', name: 'old' } as any);
    ventureRepository.save.mockResolvedValue({ id: 'v1', name: 'new' });
    await expect(service.update('slug', { name: 'new' } as any)).resolves.toEqual({ id: 'v1', name: 'new' });
  });

  it('sets logo', async () => {
    const { service, ventureRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'v1', logo: null } as any);
    ventureRepository.save.mockResolvedValue({ id: 'v1', logo: 'logo.png' });
    await expect(service.setLogo('v1', 'logo.png')).resolves.toEqual({ id: 'v1', logo: 'logo.png' });
  });

  it('sets cover', async () => {
    const { service, ventureRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'v1', cover: null } as any);
    ventureRepository.save.mockResolvedValue({ id: 'v1', cover: 'cover.png' });
    await expect(service.setCover('v1', 'cover.png')).resolves.toEqual({ id: 'v1', cover: 'cover.png' });
  });

  it('removes venture', async () => {
    const { service, ventureRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'v1' } as any);
    ventureRepository.softDelete.mockResolvedValue(undefined);
    await expect(service.remove('v1')).resolves.toBeUndefined();
    expect(ventureRepository.softDelete).toHaveBeenCalledWith('v1');
  });
});
