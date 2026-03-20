import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { User } from '@/modules/users/entities/user.entity';
import { FilterCommentsDto } from './dto/filter-comments.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>
  ) {}

  async create(dto: CreateCommentDto, user: User): Promise<Comment> {
    try {
      const comment = await this.commentsRepository.save({
        ...dto,
        article: { id: dto.articleId },
        author: user
      });
      return await this.findOne(comment.id);
    } catch {
      throw new BadRequestException('Création du commentaire impossible');
    }
  }

  async findAll(): Promise<Comment[]> {
    return await this.commentsRepository.find();
  }

  async findByArticle(slug: string, dto: FilterCommentsDto): Promise<[Comment[], number]> {
    try {
      const { page = 1 } = dto;
      return await this.commentsRepository.findAndCount({
        where: { article: { slug } },
        relations: ['author'],
        order: { created_at: 'DESC' },
        skip: (+page - 1) * 20,
        take: 20
      });
    } catch {
      throw new BadRequestException('Commentaires introuvables');
    }
  }

  async findOne(id: string): Promise<Comment> {
    try {
      return await this.commentsRepository.findOne({
        where: { id },
        relations: ['author']
      });
    } catch {
      throw new NotFoundException('Commentaire introuvable');
    }
  }

  async update(id: string, dto: UpdateCommentDto): Promise<Comment> {
    try {
      const comment = await this.findOne(id);
      const newComment = this.commentsRepository.merge(comment, {
        ...dto,
        article: { id: dto.articleId }
      });
      return await this.commentsRepository.save(newComment);
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.findOne(id);
      await this.commentsRepository.delete(id);
    } catch {
      throw new BadRequestException('Suppression impossible');
    }
  }
}
