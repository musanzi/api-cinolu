import { Module } from '@nestjs/common';
import { VenturesController } from './controllers/ventures.controller';
import { VenturesService } from './services/ventures.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venture } from './entities/venture.entity';
import { VentureSubscriber } from './subscribers/venture.subscriber';
import { ProductsModule } from '../../ventures/products/products.module';
import { VentureDocument } from './entities/document.entity';
import { GalleriesModule } from '../../galleries/galleries.module';

@Module({
  imports: [TypeOrmModule.forFeature([Venture, VentureDocument]), ProductsModule, GalleriesModule],
  controllers: [VenturesController],
  providers: [VenturesService, VentureSubscriber],
  exports: [VenturesService]
})
export class VenturesModule {}
