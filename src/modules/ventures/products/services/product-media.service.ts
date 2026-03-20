import { BadRequestException, Injectable } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Gallery } from '@/shared/galleries/entities/gallery.entity';
import { GalleriesService } from '@/shared/galleries/galleries.service';

@Injectable()
export class ProductMediaService {
  constructor(
    private readonly galleriesService: GalleriesService,
    private readonly productsService: ProductsService
  ) {}

  async addImage(id: string, file: Express.Multer.File): Promise<void> {
    try {
      await this.productsService.findOne(id);
      const dto = {
        image: file.filename,
        product: { id }
      };
      await this.galleriesService.create(dto);
    } catch {
      throw new BadRequestException("Ajout d'image impossible");
    }
  }

  async removeGallery(id: string): Promise<void> {
    try {
      await this.galleriesService.remove(id);
    } catch {
      throw new BadRequestException("Suppression de l'image impossible");
    }
  }

  async findGallery(slug: string): Promise<Gallery[]> {
    try {
      return await this.galleriesService.findGallery('product', slug);
    } catch {
      throw new BadRequestException('Galerie introuvable');
    }
  }
}
