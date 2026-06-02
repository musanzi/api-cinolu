import { Module } from '@nestjs/common';
import { ArticlesModule } from './articles/articles.module';
import { TagsModule } from './tags/tags.module';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [ArticlesModule, TagsModule, CommentsModule]
})
export class BlogModule {}
