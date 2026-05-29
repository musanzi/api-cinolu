import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventsService } from '@/modules/events/events/services/events.service';

const makeQueryBuilder = (result: [any[], number] = [[], 0]) => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue(result)
});

describe('EventsService', () => {
  const setup = () => {
    const queryBuilder = makeQueryBuilder([[{ id: 'e1' }], 1]);
    const eventRepository = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      find: jest.fn(),
      findOneOrFail: jest.fn(),
      softDelete: jest.fn()
    } as any;
    const service = new EventsService(eventRepository);
    return { service, eventRepository, queryBuilder };
  };

  it('creates an event', async () => {
    const { service, eventRepository } = setup();
    eventRepository.create.mockReturnValue({ name: 'event' });
    eventRepository.save.mockResolvedValue({ id: 'e1' });
    await expect(
      service.create({ event_manager: 'u1', program: 'p1', categories: ['c1'], name: 'A' } as any)
    ).resolves.toEqual({ id: 'e1' });
    expect(eventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        event_manager: { id: 'u1' },
        program: { id: 'p1' },
        categories: [{ id: 'c1' }]
      })
    );
  });

  it('throws on create failure', async () => {
    const { service, eventRepository } = setup();
    eventRepository.create.mockImplementation(() => {
      throw new Error('bad');
    });
    await expect(service.create({ categories: [] } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds all with filters', async () => {
    const { service, queryBuilder } = setup();
    await expect(
      service.findAll({ page: 2, q: 'hack', categories: ['c1'], filter: 'published' } as any)
    ).resolves.toEqual([[{ id: 'e1' }], 1]);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('e.is_published = :isPublished', { isPublished: true });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('(e.name LIKE :q OR e.description LIKE :q)', { q: '%hack%' });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('categories.id IN (:...categories)', { categories: ['c1'] });
    expect(queryBuilder.skip).toHaveBeenCalledWith(20);
    expect(queryBuilder.take).toHaveBeenCalledWith(20);
  });

  it('findAll supports highlighted and drafts filters', async () => {
    const { service, queryBuilder } = setup();
    await service.findAll({ filter: 'highlighted' } as any);
    await service.findAll({ filter: 'drafts' } as any);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('e.is_highlighted = :isHighlighted', { isHighlighted: true });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('e.is_published = :isPublished', { isPublished: false });
  });

  it('finds published events', async () => {
    const { service, queryBuilder } = setup();
    await expect(service.findPublished({ page: 1, q: 'bootcamp', categories: ['c1'] } as any)).resolves.toEqual([
      [{ id: 'e1' }],
      1
    ]);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('e.is_published = :is_published', { is_published: true });
    expect(queryBuilder.take).toHaveBeenCalledWith(40);
  });

  it('toggles highlight flag', async () => {
    const { service, eventRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'e1', is_highlighted: false } as any);
    eventRepository.save.mockResolvedValue({ id: 'e1', is_highlighted: true });
    await expect(service.highlight('e1')).resolves.toEqual({ id: 'e1', is_highlighted: true });
  });

  it('throws on highlight failure', async () => {
    const { service } = setup();
    jest.spyOn(service, 'findOne').mockRejectedValue(new Error('bad'));
    await expect(service.highlight('e1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('toggles publish flag', async () => {
    const { service, eventRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'e1', is_published: false } as any);
    eventRepository.save.mockResolvedValue({ id: 'e1', is_published: true });
    await expect(service.togglePublish('e1')).resolves.toEqual({ id: 'e1', is_published: true });
  });

  it('sets cover', async () => {
    const { service, eventRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'e1', cover: null } as any);
    eventRepository.save.mockResolvedValue({ id: 'e1', cover: 'img.png' });
    await expect(service.setCover('e1', 'img.png')).resolves.toEqual({ id: 'e1', cover: 'img.png' });
  });

  it('finds recent events', async () => {
    const { service, eventRepository } = setup();
    eventRepository.find.mockResolvedValue([{ id: 'e1' }]);
    await expect(service.findRecent()).resolves.toEqual([{ id: 'e1' }]);
  });

  it('throws on findRecent failure', async () => {
    const { service, eventRepository } = setup();
    eventRepository.find.mockRejectedValue(new Error('bad'));
    await expect(service.findRecent()).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds by slug', async () => {
    const { service, eventRepository } = setup();
    eventRepository.findOneOrFail.mockResolvedValue({ id: 'e1', slug: 's' });
    await expect(service.findBySlug('s')).resolves.toEqual({ id: 'e1', slug: 's' });
  });

  it('throws on missing slug', async () => {
    const { service, eventRepository } = setup();
    eventRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.findBySlug('s')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('finds one by id', async () => {
    const { service, eventRepository } = setup();
    eventRepository.findOneOrFail.mockResolvedValue({ id: 'e1' });
    await expect(service.findOne('e1')).resolves.toEqual({ id: 'e1' });
  });

  it('throws on missing event id', async () => {
    const { service, eventRepository } = setup();
    eventRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.findOne('e1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates event relations and fields', async () => {
    const { service, eventRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'e1',
      event_manager: { id: 'old' },
      program: { id: 'p-old' },
      categories: [{ id: 'c-old' }]
    } as any);
    eventRepository.save.mockResolvedValue({ id: 'e1', name: 'new' });
    await expect(
      service.update('e1', { name: 'new', event_manager: 'u2', program: 'p2', categories: ['c2'] } as any)
    ).resolves.toEqual({ id: 'e1', name: 'new' });
  });

  it('throws on update failure', async () => {
    const { service } = setup();
    jest.spyOn(service, 'findOne').mockRejectedValue(new Error('bad'));
    await expect(service.update('e1', { name: 'new' } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('soft deletes event', async () => {
    const { service, eventRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'e1' } as any);
    eventRepository.softDelete.mockResolvedValue(undefined);
    await expect(service.remove('e1')).resolves.toBeUndefined();
    expect(eventRepository.softDelete).toHaveBeenCalledWith('e1');
  });

  it('throws on remove failure', async () => {
    const { service } = setup();
    jest.spyOn(service, 'findOne').mockRejectedValue(new Error('bad'));
    await expect(service.remove('e1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
