import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../entities/article.entity';
import { AbstractRepository } from '@/shared/abstracts/abstract.repository';
import { FilterArticlesInterface } from '../interfaces/filter-articles.interface';
import { promises as fs } from 'fs';
import { Gallery } from '@/modules/galleries/entities/gallery.entity';
import { GalleriesService } from '@/modules/galleries/services/galleries.service';

@Injectable()
export class ArticlesService extends AbstractRepository<Article> {
  constructor(
    @InjectRepository(Article)
    repository: Repository<Article>,
    private readonly galleriesService: GalleriesService
  ) {
    super(repository);
  }

  async create(dto: CreateArticleDto, userId: string): Promise<Article> {
    return await this.createEntity({
      ...dto,
      published_at: dto.published_at ? new Date(dto.published_at) : new Date(),
      tags: dto.tags.map((id) => ({ id })),
      author: { id: userId }
    });
  }

  async highlight(id: string): Promise<Article> {
    const article = await this.findEntity({ where: { id } });
    return await this.updateEntity(id, {
      is_highlighted: !article.is_highlighted
    });
  }

  async findRecent(): Promise<Article[]> {
    return await this.findEntities({
      order: { created_at: 'DESC' },
      take: 6,
      relations: ['tags', 'author']
    });
  }

  async findAll(queryParams: FilterArticlesInterface): Promise<[Article[], number]> {
    const { q, page, filter = 'all' } = queryParams;
    const query = this.repository.createQueryBuilder('a').orderBy('a.created_at', 'DESC');
    if (filter === 'published') query.andWhere('a.published_at IS NOT NULL AND a.published_at <= NOW()');
    if (filter === 'drafts') query.andWhere('a.published_at IS NULL OR a.published_at > NOW()');
    if (filter === 'highlighted') query.andWhere('a.is_highlighted = :isHighlighted', { isHighlighted: true });
    if (q) query.andWhere('a.title LIKE :search OR a.content LIKE :search', { search: `%${q}%` });
    return await this.findPaginatedEntities(query, { page, take: 20 });
  }

  async findPublished(queryParams: FilterArticlesInterface): Promise<[Article[], number]> {
    const query = this.repository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.tags', 'tags')
      .where('a.published_at <= NOW()')
      .orderBy('a.published_at', 'DESC');
    return await this.findPaginatedEntities(query, { page: queryParams.page, take: 12 });
  }

  async findBySlug(slug: string): Promise<Article> {
    return await this.findEntity({
      where: { slug },
      relations: ['tags', 'author', 'gallery']
    });
  }

  async togglePublished(id: string): Promise<Article> {
    const article = await this.findEntity({ where: { id } });
    return await this.updateEntity(id, {
      published_at: article.published_at ? null : new Date()
    });
  }

  async findOne(id: string): Promise<Article> {
    return await this.findEntity({
      where: { id },
      relations: ['tags', 'author', 'gallery']
    });
  }

  async update(id: string, dto: UpdateArticleDto): Promise<Article> {
    return await this.updateEntity(id, {
      ...dto,
      tags: dto.tags ? dto.tags.map((id) => ({ id })) : null
    });
  }

  async remove(id: string): Promise<void> {
    await this.deleteEntity(id);
  }

  async setImage(id: string, image: string): Promise<Article> {
    return await this.updateEntity(id, { image });
  }

  async addImage(id: string, file: Express.Multer.File): Promise<void> {
    try {
      await this.findOne(id);
      const dto = { image: file.filename, article: { id } };
      await this.galleriesService.create(dto);
    } catch {
      throw new BadRequestException("Ajout d'image impossible");
    }
  }

  async removeGallery(id: string): Promise<void> {
    try {
      await this.galleriesService.remove(id);
    } catch {
      throw new BadRequestException("Suppression de l'image impossible");
    }
  }

  async findGallery(slug: string): Promise<Gallery[]> {
    try {
      return await this.galleriesService.findGallery('article', slug);
    } catch {
      throw new BadRequestException('Galerie introuvable');
    }
  }

  async addCover(id: string, file: Express.Multer.File): Promise<Article> {
    try {
      const article = await this.findOne(id);
      if (article.image) await fs.unlink(`./uploads/articles/${article.image}`);
      return await this.setImage(id, file.filename);
    } catch {
      throw new BadRequestException('Ajout de couverture impossible');
    }
  }
}
