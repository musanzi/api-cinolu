import { Injectable } from '@nestjs/common';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { FilterCommentsInterface } from '../interfaces/filter-comments.interface';
import { AbstractRepository } from '@/modules/database/abstract.repository';

@Injectable()
export class CommentsService extends AbstractRepository<Comment> {
  constructor(
    @InjectRepository(Comment)
    repository: Repository<Comment>
  ) {
    super(repository);
  }

  async create(dto: CreateCommentDto, userId: string): Promise<Comment> {
    return await this.createEntity({ ...dto, article: { id: dto.articleId }, author: { id: userId } });
  }

  async findAll(): Promise<Comment[]> {
    return await this.findEntities();
  }

  async findByArticle(slug: string, dto: FilterCommentsInterface): Promise<[Comment[], number]> {
    const query = this.repository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoin('comment.article', 'article')
      .where('article.slug = :slug', { slug })
      .orderBy('comment.created_at', 'DESC');
    return await this.findPaginatedEntities(query, { page: dto.page, take: 20 });
  }

  async findOne(id: string): Promise<Comment> {
    return await this.findEntity({ where: { id }, relations: ['author'] });
  }

  async update(id: string, dto: UpdateCommentDto): Promise<Comment> {
    return await this.updateEntity(id, { ...dto, ...(dto.articleId && { article: { id: dto.articleId } }) });
  }

  async remove(id: string): Promise<void> {
    await this.hardDeleteEntity(id);
  }
}
