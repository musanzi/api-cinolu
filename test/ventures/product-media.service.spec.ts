import { BadRequestException } from '@nestjs/common';
import { ProductMediaService } from '@/modules/ventures/products/services/product-media.service';

describe('ProductMediaService', () => {
  const setup = () => {
    const galleriesService = {
      create: jest.fn(),
      remove: jest.fn(),
      findGallery: jest.fn()
    } as any;
    const productsService = { findOne: jest.fn() } as any;
    const service = new ProductMediaService(galleriesService, productsService);
    return { service, galleriesService, productsService };
  };

  it('adds image to product gallery', async () => {
    const { service, productsService, galleriesService } = setup();
    productsService.findOne.mockResolvedValue({ id: 'p1' });
    galleriesService.create.mockResolvedValue(undefined);
    await expect(service.addImage('p1', { filename: 'img.png' } as any)).resolves.toBeUndefined();
    expect(galleriesService.create).toHaveBeenCalledWith({ image: 'img.png', product: { id: 'p1' } });
  });

  it('removes gallery item', async () => {
    const { service, galleriesService } = setup();
    galleriesService.remove.mockResolvedValue(undefined);
    await expect(service.removeGallery('g1')).resolves.toBeUndefined();
  });

  it('finds gallery by product slug', async () => {
    const { service, galleriesService } = setup();
    galleriesService.findGallery.mockResolvedValue([{ id: 'g1' }]);
    await expect(service.findGallery('slug')).resolves.toEqual([{ id: 'g1' }]);
    expect(galleriesService.findGallery).toHaveBeenCalledWith('product', 'slug');
  });

  it('wraps failures in bad request', async () => {
    const { service, productsService } = setup();
    productsService.findOne.mockRejectedValue(new Error('bad'));
    await expect(service.addImage('p1', { filename: 'x.png' } as any)).rejects.toBeInstanceOf(BadRequestException);
  });
});
