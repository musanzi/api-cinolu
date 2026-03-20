import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, Public, Rbac } from '@musanzi/nestjs-session-auth';
import { User } from '@/modules/users/entities/user.entity';
import { CreateArticleDto } from '../dto/create-article.dto';
import { FilterArticlesDto } from '../dto/filter-articles.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';
import { Article } from '../entities/article.entity';
import { ArticlesService } from '../services/articles.service';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @Rbac({ resource: 'blogs', action: 'create' })
  create(@CurrentUser() user: User, @Body() dto: CreateArticleDto): Promise<Article> {
    return this.articlesService.create(dto, user);
  }

  @Get('recent')
  @Public()
  findRecent(): Promise<Article[]> {
    return this.articlesService.findRecent();
  }

  @Get()
  @Rbac({ resource: 'blogs', action: 'read' })
  findAll(@Query() dto: FilterArticlesDto): Promise<[Article[], number]> {
    return this.articlesService.findAll(dto);
  }

  @Get('published')
  @Public()
  findPublished(@Query() dto: FilterArticlesDto): Promise<[Article[], number]> {
    return this.articlesService.findPublished(dto);
  }

  @Patch('id/:articleId/publish')
  @Rbac({ resource: 'blogs', action: 'update' })
  togglePublished(@Param('articleId') articleId: string): Promise<Article> {
    return this.articlesService.togglePublished(articleId);
  }

  @Get('by-slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string): Promise<Article> {
    return this.articlesService.findBySlug(slug);
  }

  @Get('id/:articleId')
  @Rbac({ resource: 'blogs', action: 'read' })
  findOne(@Param('articleId') articleId: string): Promise<Article> {
    return this.articlesService.findOne(articleId);
  }

  @Patch('id/:articleId/highlight')
  @Rbac({ resource: 'blogs', action: 'update' })
  toggleHighlight(@Param('articleId') articleId: string): Promise<Article> {
    return this.articlesService.highlight(articleId);
  }

  @Patch('id/:articleId')
  @Rbac({ resource: 'blogs', action: 'update' })
  update(@Param('articleId') articleId: string, @Body() dto: UpdateArticleDto): Promise<Article> {
    return this.articlesService.update(articleId, dto);
  }

  @Delete('id/:articleId')
  @Rbac({ resource: 'blogs', action: 'delete' })
  remove(@Param('articleId') articleId: string): Promise<void> {
    return this.articlesService.remove(articleId);
  }
}
