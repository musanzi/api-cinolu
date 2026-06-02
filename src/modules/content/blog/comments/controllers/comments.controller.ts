import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CommentsService } from '../comments.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { Comment } from '../entities/comment.entity';
import { FilterCommentsDto } from '../dto/filter-comments.dto';
import { CurrentUser, Public, Roles } from '@/modules/auth/decorators';
import { User } from '@/modules/identity/users/entities/user.entity';
import { RoleEnum } from '@/modules/auth/enums';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateCommentDto): Promise<Comment> {
    return this.commentsService.create(dto, user.id);
  }

  @Get()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  findAll(): Promise<Comment[]> {
    return this.commentsService.findAll();
  }

  @Get('by-article/:slug')
  @Public()
  findByArticle(@Param('slug') slug: string, @Query() dto: FilterCommentsDto): Promise<[Comment[], number]> {
    return this.commentsService.findByArticle(slug, dto);
  }

  @Get('id/:id')
  findOne(@Param('id') id: string): Promise<Comment> {
    return this.commentsService.findOne(id);
  }

  @Patch('id/:id')
  update(@Param('id') id: string, @Body() dto: UpdateCommentDto): Promise<Comment> {
    return this.commentsService.update(id, dto);
  }

  @Delete('id/:id')
  remove(@Param('id') id: string): Promise<void> {
    return this.commentsService.remove(id);
  }
}
