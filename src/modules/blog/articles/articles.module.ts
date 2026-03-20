import { Module } from '@nestjs/common';
import { ArticleMediaController } from './controllers/article-media.controller';
import { ArticlesController } from './controllers/articles.controller';
import { ArticlesService } from './services/articles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { ArticlesSubscriber } from './subscribers/articles.subscriber';
import { ArticleMediaService } from './services/article-media.service';
import { GalleriesModule } from '@/shared/galleries/galleries.module';

@Module({
  imports: [TypeOrmModule.forFeature([Article]), GalleriesModule],
  providers: [ArticlesService, ArticleMediaService, ArticlesSubscriber],
  controllers: [ArticlesController, ArticleMediaController]
})
export class ArticlesModule {}
