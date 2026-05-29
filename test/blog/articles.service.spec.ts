import { BadRequestException } from '@nestjs/common';
import { ArticlesService } from '../../src/modules/content/blog/articles/services/articles.service';

const makeQueryBuilder = (result: [any[], number] = [[], 0]) => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue(result)
});

describe('ArticlesService', () => {
  const setup = () => {
    const queryBuilder = makeQueryBuilder([[{ id: 'a1' }], 1]);
    const articlesRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOneOrFail: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      merge: jest.fn(),
      delete: jest.fn()
    } as any;
    const service = new ArticlesService(articlesRepository);
    return { service, articlesRepository, queryBuilder };
  };

  it('creates an article with mapped tags and explicit publish date', async () => {
    const { service, articlesRepository } = setup();
    articlesRepository.save.mockResolvedValue({ id: 'a1' });

    await expect(
      service.create(
        { title: 'Article', content: 'Body', tags: ['t1', 't2'], published_at: '2026-01-15T10:00:00.000Z' } as any,
        { id: 'u1' } as any
      )
    ).resolves.toEqual({ id: 'a1' });

    expect(articlesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Article',
        content: 'Body',
        tags: [{ id: 't1' }, { id: 't2' }],
        author: { id: 'u1' },
        published_at: new Date('2026-01-15T10:00:00.000Z')
      })
    );
  });

  it('creates an article with current date when publish date is missing', async () => {
    const { service, articlesRepository } = setup();
    articlesRepository.save.mockResolvedValue({ id: 'a1' });

    await service.create({ title: 'Article', content: 'Body', tags: ['t1'] } as any, { id: 'u1' } as any);

    expect(articlesRepository.save).toHaveBeenCalledWith(expect.objectContaining({ published_at: expect.any(Date) }));
  });

  it('throws on create failure', async () => {
    const { service, articlesRepository } = setup();
    articlesRepository.save.mockRejectedValue(new Error('bad'));

    await expect(
      service.create({ title: 'A', content: 'B', tags: ['t1'] } as any, { id: 'u1' } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('toggles highlight flag', async () => {
    const { service, articlesRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'a1', is_highlighted: false } as any);
    articlesRepository.save.mockResolvedValue({ id: 'a1', is_highlighted: true });

    await expect(service.highlight('a1')).resolves.toEqual({ id: 'a1', is_highlighted: true });
    expect(articlesRepository.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'a1', is_highlighted: true }));
  });

  it('finds recent articles with relations', async () => {
    const { service, articlesRepository } = setup();
    articlesRepository.find.mockResolvedValue([{ id: 'a1' }]);

    await expect(service.findRecent()).resolves.toEqual([{ id: 'a1' }]);
    expect(articlesRepository.find).toHaveBeenCalledWith({
      order: { created_at: 'DESC' },
      take: 6,
      relations: ['tags', 'author']
    });
  });

  it('findAll applies published filter, search, and page window', async () => {
    const { service, queryBuilder } = setup();

    await expect(service.findAll({ filter: 'published', q: 'nestjs', page: '2' } as any)).resolves.toEqual([
      [{ id: 'a1' }],
      1
    ]);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('a.published_at IS NOT NULL AND a.published_at <= NOW()');
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('a.title LIKE :search OR a.content LIKE :search', {
      search: '%nestjs%'
    });
    expect(queryBuilder.skip).toHaveBeenCalledWith(20);
    expect(queryBuilder.take).toHaveBeenCalledWith(20);
  });

  it('findAll applies drafts and highlighted filters', async () => {
    const { service, queryBuilder } = setup();

    await service.findAll({ filter: 'drafts', q: null, page: '1' } as any);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('a.published_at IS NULL OR a.published_at > NOW()');

    queryBuilder.andWhere.mockClear();
    await service.findAll({ filter: 'highlighted', q: null, page: '1' } as any);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('a.is_highlighted = :isHighlighted', { isHighlighted: true });
  });

  it('findPublished applies pagination only when page is provided', async () => {
    const { service, queryBuilder } = setup();

    await expect(service.findPublished({ page: '3' } as any)).resolves.toEqual([[{ id: 'a1' }], 1]);
    expect(queryBuilder.where).toHaveBeenCalledWith('a.published_at <= NOW()');
    expect(queryBuilder.skip).toHaveBeenCalledWith(24);
    expect(queryBuilder.take).toHaveBeenCalledWith(12);

    queryBuilder.skip.mockClear();
    queryBuilder.take.mockClear();
    await service.findPublished({} as any);
    expect(queryBuilder.skip).not.toHaveBeenCalled();
    expect(queryBuilder.take).not.toHaveBeenCalled();
  });

  it('finds by slug with relations', async () => {
    const { service, articlesRepository } = setup();
    articlesRepository.findOneOrFail.mockResolvedValue({ id: 'a1', slug: 'article' });

    await expect(service.findBySlug('article')).resolves.toEqual({ id: 'a1', slug: 'article' });
    expect(articlesRepository.findOneOrFail).toHaveBeenCalledWith({
      where: { slug: 'article' },
      relations: ['tags', 'author', 'gallery']
    });
  });

  it('togglePublished sets current date when draft and null when already published', async () => {
    const { service, articlesRepository } = setup();
    const draft = { id: 'a1', published_at: null };
    const published = { id: 'a1', published_at: new Date('2026-01-01T00:00:00.000Z') };
    const findOneSpy = jest.spyOn(service, 'findOne');
    findOneSpy.mockResolvedValueOnce(draft as any).mockResolvedValueOnce(published as any);
    articlesRepository.save.mockResolvedValueOnce({ id: 'a1', published_at: new Date() }).mockResolvedValueOnce({
      id: 'a1',
      published_at: null
    });

    await service.togglePublished('a1');
    expect(articlesRepository.save).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: 'a1', published_at: expect.any(Date) })
    );

    await service.togglePublished('a1');
    expect(articlesRepository.save).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: 'a1', published_at: null })
    );
  });

  it('finds one by id', async () => {
    const { service, articlesRepository } = setup();
    articlesRepository.findOneOrFail.mockResolvedValue({ id: 'a1' });

    await expect(service.findOne('a1')).resolves.toEqual({ id: 'a1' });
    expect(articlesRepository.findOneOrFail).toHaveBeenCalledWith({
      where: { id: 'a1' },
      relations: ['tags', 'author', 'gallery']
    });
  });

  it('updates article and maps tags', async () => {
    const { service, articlesRepository } = setup();
    const existing = { id: 'a1', tags: [{ id: 'old' }] };
    jest.spyOn(service, 'findOne').mockResolvedValue(existing as any);
    articlesRepository.save.mockResolvedValue({ id: 'a1', tags: [{ id: 't1' }] });

    await expect(service.update('a1', { title: 'Updated', tags: ['t1'] } as any)).resolves.toEqual({
      id: 'a1',
      tags: [{ id: 't1' }]
    });
    expect(articlesRepository.merge).toHaveBeenCalledWith(
      existing,
      expect.objectContaining({ title: 'Updated', tags: [{ id: 't1' }] })
    );
  });

  it('throws on update failure when tags are missing', async () => {
    const { service, articlesRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'a1', tags: [{ id: 'old' }] } as any);
    articlesRepository.merge.mockImplementation(() => undefined);

    await expect(service.update('a1', { title: 'Updated' } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('removes article after ensuring it exists', async () => {
    const { service, articlesRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'a1' } as any);
    articlesRepository.delete.mockResolvedValue(undefined);

    await expect(service.remove('a1')).resolves.toBeUndefined();
    expect(articlesRepository.delete).toHaveBeenCalledWith('a1');
  });

  it('sets article image', async () => {
    const { service, articlesRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'a1', image: null } as any);
    articlesRepository.save.mockResolvedValue({ id: 'a1', image: 'cover.png' });

    await expect(service.setImage('a1', 'cover.png')).resolves.toEqual({ id: 'a1', image: 'cover.png' });
    expect(articlesRepository.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'a1', image: 'cover.png' }));
  });
});
