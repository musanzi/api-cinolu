import { BadRequestException } from '@nestjs/common';
import { CommentsService } from '@/modules/content/blog/comments/comments.service';

describe('CommentsService', () => {
  const setup = () => {
    const commentsRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn(),
      delete: jest.fn()
    } as any;
    const service = new CommentsService(commentsRepository);
    return { service, commentsRepository };
  };

  it('creates comment and reloads it', async () => {
    const { service, commentsRepository } = setup();
    commentsRepository.save.mockResolvedValue({ id: 'c1' });
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'c1', content: 'hello' } as any);
    await expect(service.create({ content: 'hello', articleId: 'a1' } as any, { id: 'u1' } as any)).resolves.toEqual({
      id: 'c1',
      content: 'hello'
    });
  });

  it('throws bad request when create fails', async () => {
    const { service, commentsRepository } = setup();
    commentsRepository.save.mockRejectedValue(new Error('bad'));
    await expect(service.create({ articleId: 'a1' } as any, { id: 'u1' } as any)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('finds all comments', async () => {
    const { service, commentsRepository } = setup();
    commentsRepository.find.mockResolvedValue([{ id: 'c1' }]);
    await expect(service.findAll()).resolves.toEqual([{ id: 'c1' }]);
  });

  it('finds comments by article', async () => {
    const { service, commentsRepository } = setup();
    commentsRepository.findAndCount.mockResolvedValue([[{ id: 'c1' }], 1]);
    await expect(service.findByArticle('article-slug', { page: 2 } as any)).resolves.toEqual([[{ id: 'c1' }], 1]);
    expect(commentsRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { article: { slug: 'article-slug' } },
        skip: 20,
        take: 20
      })
    );
  });

  it('defaults to first page when page is missing', async () => {
    const { service, commentsRepository } = setup();
    commentsRepository.findAndCount.mockResolvedValue([[{ id: 'c1' }], 1]);

    await expect(service.findByArticle('article-slug', {} as any)).resolves.toEqual([[{ id: 'c1' }], 1]);
    expect(commentsRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20
      })
    );
  });

  it('throws bad request when article query fails', async () => {
    const { service, commentsRepository } = setup();
    commentsRepository.findAndCount.mockRejectedValue(new Error('bad'));
    await expect(service.findByArticle('article-slug', {} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds one comment', async () => {
    const { service, commentsRepository } = setup();
    commentsRepository.findOne.mockResolvedValue({ id: 'c1' });
    await expect(service.findOne('c1')).resolves.toEqual({ id: 'c1' });
  });

  it('updates a comment', async () => {
    const { service, commentsRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'c1', content: 'old' } as any);
    commentsRepository.merge.mockReturnValue({ id: 'c1', content: 'new' });
    commentsRepository.save.mockResolvedValue({ id: 'c1', content: 'new' });
    await expect(service.update('c1', { content: 'new', articleId: 'a1' } as any)).resolves.toEqual({
      id: 'c1',
      content: 'new'
    });
  });

  it('throws bad request when update fails', async () => {
    const { service } = setup();
    jest.spyOn(service, 'findOne').mockRejectedValue(new Error('bad'));
    await expect(service.update('c1', {} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('removes a comment', async () => {
    const { service, commentsRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'c1' } as any);
    commentsRepository.delete.mockResolvedValue(undefined);
    await expect(service.remove('c1')).resolves.toBeUndefined();
    expect(commentsRepository.delete).toHaveBeenCalledWith('c1');
  });

  it('throws bad request when remove fails', async () => {
    const { service } = setup();
    jest.spyOn(service, 'findOne').mockRejectedValue(new Error('bad'));
    await expect(service.remove('c1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
