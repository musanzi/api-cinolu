import { BadRequestException, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { Article } from '../entities/article.entity';
import { ArticlesService } from './articles.service';
import { Gallery } from '@/shared/galleries/entities/gallery.entity';
import { GalleriesService } from '@/shared/galleries/galleries.service';

@Injectable()
export class ArticleMediaService {
  constructor(
    private readonly galleriesService: GalleriesService,
    private readonly articlesService: ArticlesService
  ) {}

  async addImage(id: string, file: Express.Multer.File): Promise<void> {
    try {
      await this.articlesService.findOne(id);
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
      const article = await this.articlesService.findOne(id);
      if (article.image) await fs.unlink(`./uploads/articles/${article.image}`);
      return await this.articlesService.setImage(id, file.filename);
    } catch {
      throw new BadRequestException('Ajout de couverture impossible');
    }
  }
}
