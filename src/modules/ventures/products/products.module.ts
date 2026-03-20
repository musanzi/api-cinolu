import { Module } from '@nestjs/common';
import { ProductMediaController } from './controllers/product-media.controller';
import { ProductsController } from './controllers/products.controller';
import { ProductsService } from './services/products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductSubscriber } from './subscribers/product.subscriber';
import { ProductMediaService } from './services/product-media.service';
import { GalleriesModule } from '@/shared/galleries/galleries.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), GalleriesModule],
  controllers: [ProductsController, ProductMediaController],
  providers: [ProductsService, ProductMediaService, ProductSubscriber],
  exports: [ProductsService]
})
export class ProductsModule {}
