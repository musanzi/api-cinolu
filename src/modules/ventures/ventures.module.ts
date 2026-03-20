import { Module } from '@nestjs/common';
import { VentureMediaController } from './controllers/venture-media.controller';
import { VenturesController } from './controllers/ventures.controller';
import { VenturesService } from './services/ventures.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venture } from './entities/venture.entity';
import { VentureSubscriber } from './subscribers/venture.subscriber';
import { ProductsModule } from './products/products.module';
import { VentureDocument } from './entities/document.entity';
import { VenturesEmailService } from './services/ventures-email.service';
import { VentureMediaService } from './services/venture-media.service';
import { VENTURES_RBAC_POLICY } from './ventures-rbac';
import { GalleriesModule } from '@/shared/galleries/galleries.module';
import { SessionAuthModule } from '@musanzi/nestjs-session-auth';

@Module({
  imports: [
    TypeOrmModule.forFeature([Venture, VentureDocument]),
    ProductsModule,
    GalleriesModule,
    SessionAuthModule.forFeature([VENTURES_RBAC_POLICY])
  ],
  controllers: [VenturesController, VentureMediaController],
  providers: [VenturesService, VentureMediaService, VenturesEmailService, VentureSubscriber],
  exports: [VenturesService]
})
export class VenturesModule {}
