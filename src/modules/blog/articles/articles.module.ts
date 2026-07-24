import { Module } from '@nestjs/common';
import { ArticlesController } from './controllers/articles.controller';
import { ArticlesService } from './services/articles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { ArticlesSubscriber } from './subscribers/articles.subscriber';
import { GalleriesModule } from '@/modules/galleries/galleries.module';

@Module({
  imports: [TypeOrmModule.forFeature([Article]), GalleriesModule],
  providers: [ArticlesService, ArticlesSubscriber],
  controllers: [ArticlesController]
})
export class ArticlesModule {}
