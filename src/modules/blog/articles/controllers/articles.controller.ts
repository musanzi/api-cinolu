import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';
import { Article } from '../entities/article.entity';
import { ArticlesService } from '../services/articles.service';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { User } from '@/modules/users/entities/user.entity';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';
import { FilterArticlesInterface } from '../interfaces/filter-articles.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { createDiskUploadOptions } from '@/shared/helpers/upload.helper';
import { Gallery } from '@/modules/galleries/entities/gallery.entity';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @HasRoles([Roles.STAFF])
  create(@CurrentUser() user: User, @Body() dto: CreateArticleDto): Promise<Article> {
    return this.articlesService.create(dto, user.id);
  }

  @Get('recent')
  @Public()
  findRecent(): Promise<Article[]> {
    return this.articlesService.findRecent();
  }

  @Get()
  @HasRoles([Roles.STAFF])
  findAll(@Query() filters: FilterArticlesInterface): Promise<[Article[], number]> {
    return this.articlesService.findAll(filters);
  }

  @Get('published')
  @Public()
  findPublished(@Query() filters: FilterArticlesInterface): Promise<[Article[], number]> {
    return this.articlesService.findPublished(filters);
  }

  @Patch('id/:articleId/publish')
  @HasRoles([Roles.STAFF])
  togglePublished(@Param('articleId') articleId: string): Promise<Article> {
    return this.articlesService.togglePublished(articleId);
  }

  @Get('by-slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string): Promise<Article> {
    return this.articlesService.findBySlug(slug);
  }

  @Get('id/:articleId')
  @Public()
  findOne(@Param('articleId') articleId: string): Promise<Article> {
    return this.articlesService.findOne(articleId);
  }

  @Patch('id/:articleId/highlight')
  @HasRoles([Roles.STAFF])
  toggleHighlight(@Param('articleId') articleId: string): Promise<Article> {
    return this.articlesService.highlight(articleId);
  }

  @Patch('id/:articleId')
  @HasRoles([Roles.STAFF])
  update(@Param('articleId') articleId: string, @Body() dto: UpdateArticleDto): Promise<Article> {
    return this.articlesService.update(articleId, dto);
  }

  @Delete('id/:articleId')
  @HasRoles([Roles.STAFF])
  remove(@Param('articleId') articleId: string): Promise<void> {
    return this.articlesService.remove(articleId);
  }

  @Post('id/:articleId/gallery')
  @UseInterceptors(FileInterceptor('image', createDiskUploadOptions('./uploads/galleries')))
  addImage(@Param('articleId') articleId: string, @UploadedFile() file: Express.Multer.File): Promise<void> {
    return this.articlesService.addImage(articleId, file);
  }

  @Delete('gallery/:galleryId')
  removeGallery(@Param('galleryId') galleryId: string): Promise<void> {
    return this.articlesService.removeGallery(galleryId);
  }

  @Get('by-slug/:slug/gallery')
  @Public()
  findGallery(@Param('slug') slug: string): Promise<Gallery[]> {
    return this.articlesService.findGallery(slug);
  }

  @Post('id/:articleId/cover')
  @UseInterceptors(FileInterceptor('article', createDiskUploadOptions('./uploads/articles')))
  addCover(@Param('articleId') articleId: string, @UploadedFile() file: Express.Multer.File): Promise<Article> {
    return this.articlesService.addCover(articleId, file);
  }
}
