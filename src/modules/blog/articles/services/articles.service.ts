import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../entities/article.entity';
import { FilterArticlesDto } from '../dto/filter-articles.dto';
import { User } from '@/modules/users/entities/user.entity';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private articlesRepository: Repository<Article>
  ) {}

  async create(dto: CreateArticleDto, user: User): Promise<Article> {
    try {
      return await this.articlesRepository.save({
        ...dto,
        published_at: dto.published_at ? new Date(dto.published_at) : new Date(),
        tags: dto.tags.map((id) => ({ id })),
        author: user
      });
    } catch {
      throw new BadRequestException("Création de l'article impossible");
    }
  }

  async highlight(id: string): Promise<Article> {
    try {
      const article = await this.findOne(id);
      return await this.articlesRepository.save({
        ...article,
        is_highlighted: !article.is_highlighted
      });
    } catch {
      throw new BadRequestException('Mise en avant impossible');
    }
  }

  async findRecent(): Promise<Article[]> {
    try {
      return await this.articlesRepository.find({
        order: { created_at: 'DESC' },
        take: 6,
        relations: ['tags', 'author']
      });
    } catch {
      throw new BadRequestException('Articles introuvables');
    }
  }

  async findAll(dto: FilterArticlesDto): Promise<[Article[], number]> {
    try {
      const { q, page = 1, filter = 'all' } = dto;
      const query = this.articlesRepository.createQueryBuilder('a').orderBy('a.created_at', 'DESC');
      if (filter === 'published') query.andWhere('a.published_at IS NOT NULL AND a.published_at <= NOW()');
      if (filter === 'drafts') query.andWhere('a.published_at IS NULL OR a.published_at > NOW()');
      if (filter === 'highlighted') query.andWhere('a.is_highlighted = :isHighlighted', { isHighlighted: true });
      if (q) query.andWhere('a.title LIKE :search OR a.content LIKE :search', { search: `%${q}%` });
      return await query
        .skip((+page - 1) * 20)
        .take(20)
        .getManyAndCount();
    } catch {
      throw new BadRequestException('Articles introuvables');
    }
  }

  async findPublished(dto: FilterArticlesDto): Promise<[Article[], number]> {
    try {
      const { page } = dto;
      const query = this.articlesRepository
        .createQueryBuilder('a')
        .leftJoinAndSelect('a.tags', 'tags')
        .where('a.published_at <= NOW()');
      if (page) query.skip((+page - 1) * 12).take(12);
      return await query.orderBy('a.published_at', 'DESC').getManyAndCount();
    } catch {
      throw new BadRequestException('Articles introuvables');
    }
  }

  async findBySlug(slug: string): Promise<Article> {
    try {
      return await this.articlesRepository.findOneOrFail({
        where: { slug },
        relations: ['tags', 'author', 'gallery']
      });
    } catch {
      throw new BadRequestException('Article introuvable');
    }
  }

  async togglePublished(id: string): Promise<Article> {
    try {
      const article = await this.findOne(id);
      article.published_at = article.published_at ? null : new Date();
      return await this.articlesRepository.save(article);
    } catch {
      throw new BadRequestException('Publication impossible');
    }
  }

  async findOne(id: string): Promise<Article> {
    try {
      return await this.articlesRepository.findOneOrFail({
        where: { id },
        relations: ['tags', 'author', 'gallery']
      });
    } catch {
      throw new BadRequestException('Article introuvable');
    }
  }

  async update(id: string, dto: UpdateArticleDto): Promise<Article> {
    try {
      const article = await this.findOne(id);
      this.articlesRepository.merge(article, {
        ...dto,
        tags: dto.tags.map((id) => ({ id })) || article.tags
      });
      return await this.articlesRepository.save(article);
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.findOne(id);
      await this.articlesRepository.delete(id);
    } catch {
      throw new BadRequestException('Suppression impossible');
    }
  }

  async setImage(id: string, image: string): Promise<Article> {
    try {
      const article = await this.findOne(id);
      return await this.articlesRepository.save({ ...article, image });
    } catch {
      throw new BadRequestException("Ajout d'image impossible");
    }
  }
}
