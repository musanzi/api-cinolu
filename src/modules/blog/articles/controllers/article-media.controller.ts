import { Controller, Delete, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createDiskUploadOptions } from '@/shared/helpers/upload.helper';
import { Gallery } from '@/modules/galleries/entities/gallery.entity';
import { Article } from '../entities/article.entity';
import { ArticleMediaService } from '../services/article-media.service';
import { Public } from '@/modules/auth/decorators';

@Controller('articles')
export class ArticleMediaController {
  constructor(private readonly articleMediaService: ArticleMediaService) {}

  @Post('id/:articleId/gallery')
  @UseInterceptors(FileInterceptor('image', createDiskUploadOptions('./uploads/galleries')))
  addImage(@Param('articleId') articleId: string, @UploadedFile() file: Express.Multer.File): Promise<void> {
    return this.articleMediaService.addImage(articleId, file);
  }

  @Delete('gallery/:galleryId')
  removeGallery(@Param('galleryId') galleryId: string): Promise<void> {
    return this.articleMediaService.removeGallery(galleryId);
  }

  @Get('by-slug/:slug/gallery')
  @Public()
  findGallery(@Param('slug') slug: string): Promise<Gallery[]> {
    return this.articleMediaService.findGallery(slug);
  }

  @Post('id/:articleId/cover')
  @UseInterceptors(FileInterceptor('article', createDiskUploadOptions('./uploads/articles')))
  addCover(@Param('articleId') articleId: string, @UploadedFile() file: Express.Multer.File): Promise<Article> {
    return this.articleMediaService.addCover(articleId, file);
  }
}
