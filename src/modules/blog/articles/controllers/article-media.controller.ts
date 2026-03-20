import { Controller, Delete, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public, Rbac } from '@musanzi/nestjs-session-auth';
import { createDiskUploadOptions } from '@/core/helpers/upload.helper';
import { Gallery } from '@/shared/galleries/entities/gallery.entity';
import { Article } from '../entities/article.entity';
import { ArticleMediaService } from '../services/article-media.service';

@Controller('articles')
export class ArticleMediaController {
  constructor(private readonly articleMediaService: ArticleMediaService) {}

  @Post('id/:articleId/gallery')
  @Rbac({ resource: 'blogs', action: 'update' })
  @UseInterceptors(FileInterceptor('image', createDiskUploadOptions('./uploads/galleries')))
  addImage(@Param('articleId') articleId: string, @UploadedFile() file: Express.Multer.File): Promise<void> {
    return this.articleMediaService.addImage(articleId, file);
  }

  @Delete('gallery/:galleryId')
  @Rbac({ resource: 'blogs', action: 'update' })
  removeGallery(@Param('galleryId') galleryId: string): Promise<void> {
    return this.articleMediaService.removeGallery(galleryId);
  }

  @Get('by-slug/:slug/gallery')
  @Public()
  findGallery(@Param('slug') slug: string): Promise<Gallery[]> {
    return this.articleMediaService.findGallery(slug);
  }

  @Post('id/:articleId/cover')
  @Rbac({ resource: 'blogs', action: 'update' })
  @UseInterceptors(FileInterceptor('article', createDiskUploadOptions('./uploads/articles')))
  addCover(@Param('articleId') articleId: string, @UploadedFile() file: Express.Multer.File): Promise<Article> {
    return this.articleMediaService.addCover(articleId, file);
  }
}
