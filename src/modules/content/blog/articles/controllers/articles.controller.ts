import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';
import { Article } from '../entities/article.entity';
import { ArticlesService } from '../services/articles.service';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { User } from '@/modules/identity/users/entities/user.entity';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { Roles } from '@/modules/auth/decorators';
import { RoleEnum } from '@/modules/auth/enums';
import { FilterArticlesInterface } from '../interfaces/filter-articles.interface';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  create(@CurrentUser() user: User, @Body() dto: CreateArticleDto): Promise<Article> {
    return this.articlesService.create(dto, user.id);
  }

  @Get('recent')
  @Public()
  findRecent(): Promise<Article[]> {
    return this.articlesService.findRecent();
  }

  @Get()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  findAll(@Query() filters: FilterArticlesInterface): Promise<[Article[], number]> {
    return this.articlesService.findAll(filters);
  }

  @Get('published')
  @Public()
  findPublished(@Query() filters: FilterArticlesInterface): Promise<[Article[], number]> {
    return this.articlesService.findPublished(filters);
  }

  @Patch('id/:articleId/publish')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
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
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  toggleHighlight(@Param('articleId') articleId: string): Promise<Article> {
    return this.articlesService.highlight(articleId);
  }

  @Patch('id/:articleId')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  update(@Param('articleId') articleId: string, @Body() dto: UpdateArticleDto): Promise<Article> {
    return this.articlesService.update(articleId, dto);
  }

  @Delete('id/:articleId')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  remove(@Param('articleId') articleId: string): Promise<void> {
    return this.articlesService.remove(articleId);
  }
}
