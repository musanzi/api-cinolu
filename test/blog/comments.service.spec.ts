import { BadRequestException } from '@nestjs/common';
import { CommentsService } from '@/modules/content/blog/comments/services/comments.service';

const makeQueryBuilder = (result: [any[], number] = [[{ id: 'c1' }], 1]) => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue(result)
});

describe('CommentsService', () => {
  const setup = () => {
    const queryBuilder = makeQueryBuilder();
    const commentsRepository = {
      create: jest.fn((dto) => dto),
      save: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOneOrFail: jest.fn(),
      merge: jest.fn((entity, dto) => ({ ...entity, ...dto })),
      delete: jest.fn()
    } as any;
    const service = new CommentsService(commentsRepository);
    return { service, commentsRepository, queryBuilder };
  };

  it('creates comment and reloads it', async () => {
    const { service, commentsRepository } = setup();
    commentsRepository.save.mockResolvedValue({ id: 'c1' });
    await expect(service.create({ content: 'hello', articleId: 'a1' } as any, 'u1')).resolves.toEqual({
      id: 'c1',
      article: { id: 'a1' },
      author: { id: 'u1' },
      content: 'hello'
    });
  });

  it('throws bad request when create fails', async () => {
    const { service, commentsRepository } = setup();
    commentsRepository.save.mockRejectedValue(new Error('bad'));
    await expect(service.create({ articleId: 'a1' } as any, 'u1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds all comments', async () => {
    const { service, commentsRepository } = setup();
    commentsRepository.find.mockResolvedValue([{ id: 'c1' }]);
    await expect(service.findAll()).resolves.toEqual([{ id: 'c1' }]);
  });

  it('finds comments by article', async () => {
    const { service, queryBuilder } = setup();
    await expect(service.findByArticle('article-slug', { page: 2 } as any)).resolves.toEqual([[{ id: 'c1' }], 1]);
    expect(queryBuilder.where).toHaveBeenCalledWith('article.slug = :slug', { slug: 'article-slug' });
    expect(queryBuilder.skip).toHaveBeenCalledWith(20);
    expect(queryBuilder.take).toHaveBeenCalledWith(20);
  });

  it('defaults to first page when page is missing', async () => {
    const { service, queryBuilder } = setup();

    await expect(service.findByArticle('article-slug', {} as any)).resolves.toEqual([[{ id: 'c1' }], 1]);
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(20);
  });

  it('throws bad request when article query fails', async () => {
    const { service, queryBuilder } = setup();
    queryBuilder.getManyAndCount.mockRejectedValue(new BadRequestException('bad'));
    await expect(service.findByArticle('article-slug', {} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds one comment', async () => {
    const { service, commentsRepository } = setup();
    commentsRepository.findOneOrFail.mockResolvedValue({ id: 'c1' });
    await expect(service.findOne('c1')).resolves.toEqual({ id: 'c1' });
  });

  it('updates a comment', async () => {
    const { service, commentsRepository } = setup();
    commentsRepository.findOneOrFail.mockResolvedValue({ id: 'c1', content: 'old' });
    commentsRepository.save.mockResolvedValue({ id: 'c1', content: 'new' });
    await expect(service.update('c1', { content: 'new', articleId: 'a1' } as any)).resolves.toEqual({
      id: 'c1',
      content: 'new'
    });
  });

  it('throws bad request when update fails', async () => {
    const { service, commentsRepository } = setup();
    commentsRepository.findOneOrFail.mockResolvedValue({ id: 'c1' });
    commentsRepository.save.mockRejectedValue(new Error('bad'));
    await expect(service.update('c1', {} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('removes a comment', async () => {
    const { service, commentsRepository } = setup();
    commentsRepository.delete.mockResolvedValue(undefined);
    await expect(service.remove('c1')).resolves.toBeUndefined();
    expect(commentsRepository.delete).toHaveBeenCalledWith('c1');
  });

  it('throws bad request when remove fails', async () => {
    const { service, commentsRepository } = setup();
    commentsRepository.delete.mockRejectedValue(new Error('bad'));
    await expect(service.remove('c1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
