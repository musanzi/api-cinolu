import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductsService } from '@/modules/ventures/products/services/products.service';

describe('ProductsService', () => {
  const setup = () => {
    const productsRepository = {
      findAndCount: jest.fn(),
      save: jest.fn(),
      findOneOrFail: jest.fn(),
      softDelete: jest.fn()
    } as any;
    const service = new ProductsService(productsRepository);
    return { service, productsRepository };
  };

  it('finds products for venture owner', async () => {
    const { service, productsRepository } = setup();
    productsRepository.findAndCount.mockResolvedValue([[{ id: 'prod1' }], 1]);
    await expect(service.findAll({ id: 'u1' } as any, { page: 2 } as any)).resolves.toEqual([[{ id: 'prod1' }], 1]);
    expect(productsRepository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ take: 10, skip: 10 }));
  });

  it('throws not found on findAll failure', async () => {
    const { service, productsRepository } = setup();
    productsRepository.findAndCount.mockRejectedValue(new Error('bad'));
    await expect(service.findAll({ id: 'u1' } as any, {} as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates product', async () => {
    const { service, productsRepository } = setup();
    productsRepository.save.mockResolvedValue({ id: 'prod1' });
    await expect(service.create({ name: 'prod', ventureId: 'v1' } as any)).resolves.toEqual({ id: 'prod1' });
    expect(productsRepository.save).toHaveBeenCalledWith(expect.objectContaining({ venture: { id: 'v1' } }));
  });

  it('throws bad request on create failure', async () => {
    const { service, productsRepository } = setup();
    productsRepository.save.mockRejectedValue(new Error('bad'));
    await expect(service.create({} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds product by slug', async () => {
    const { service, productsRepository } = setup();
    productsRepository.findOneOrFail.mockResolvedValue({ id: 'prod1', slug: 'slug' });
    await expect(service.findBySlug('slug')).resolves.toEqual({ id: 'prod1', slug: 'slug' });
  });

  it('throws not found on findBySlug failure', async () => {
    const { service, productsRepository } = setup();
    productsRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.findBySlug('slug')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('finds one by id', async () => {
    const { service, productsRepository } = setup();
    productsRepository.findOneOrFail.mockResolvedValue({ id: 'prod1' });
    await expect(service.findOne('prod1')).resolves.toEqual({ id: 'prod1' });
  });

  it('updates product by slug', async () => {
    const { service, productsRepository } = setup();
    jest.spyOn(service, 'findBySlug').mockResolvedValue({ id: 'prod1', name: 'old' } as any);
    productsRepository.save.mockResolvedValue({ id: 'prod1', name: 'new' });
    await expect(service.update('slug', { name: 'new' } as any)).resolves.toEqual({ id: 'prod1', name: 'new' });
  });

  it('throws on update failure', async () => {
    const { service } = setup();
    jest.spyOn(service, 'findBySlug').mockRejectedValue(new Error('bad'));
    await expect(service.update('slug', {} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('soft deletes product', async () => {
    const { service, productsRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'prod1' } as any);
    productsRepository.softDelete.mockResolvedValue(undefined);
    await expect(service.remove('prod1')).resolves.toBeUndefined();
  });

  it('throws on remove failure', async () => {
    const { service } = setup();
    jest.spyOn(service, 'findOne').mockRejectedValue(new Error('bad'));
    await expect(service.remove('prod1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
