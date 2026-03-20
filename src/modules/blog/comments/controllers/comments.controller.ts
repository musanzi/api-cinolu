import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CommentsService } from '../comments.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { Comment } from '../entities/comment.entity';
import { User } from '@/modules/users/entities/user.entity';
import { CurrentUser } from '@musanzi/nestjs-session-auth';
import { FilterCommentsDto } from '../dto/filter-comments.dto';
import { Rbac } from '@musanzi/nestjs-session-auth';
import { Public } from '@musanzi/nestjs-session-auth';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateCommentDto): Promise<Comment> {
    return this.commentsService.create(dto, user);
  }

  @Get()
  @Rbac({ resource: 'comments', action: 'read' })
  findAll(): Promise<Comment[]> {
    return this.commentsService.findAll();
  }

  @Get('by-article/:slug')
  @Public()
  findByArticle(@Param('slug') slug: string, @Query() dto: FilterCommentsDto): Promise<[Comment[], number]> {
    return this.commentsService.findByArticle(slug, dto);
  }

  @Get('id/:id')
  @Rbac({ resource: 'comments', action: 'read' })
  findOne(@Param('id') id: string): Promise<Comment> {
    return this.commentsService.findOne(id);
  }

  @Patch('id/:id')
  @Rbac({ resource: 'comments', action: 'update' })
  update(@Param('id') id: string, @Body() dto: UpdateCommentDto): Promise<Comment> {
    return this.commentsService.update(id, dto);
  }

  @Delete('id/:id')
  @Rbac({ resource: 'comments', action: 'delete' })
  remove(@Param('id') id: string): Promise<void> {
    return this.commentsService.remove(id);
  }
}
