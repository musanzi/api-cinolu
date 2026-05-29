import { BadRequestException, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { GalleriesService } from '@/modules/galleries/galleries.service';

describe('GalleriesService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const setup = () => {
    const galleryRepository = {
      save: jest.fn(),
      findOneOrFail: jest.fn(),
      delete: jest.fn(),
      find: jest.fn()
    } as any;
    const service = new GalleriesService(galleryRepository);
    return { service, galleryRepository };
  };

  it('creates gallery entry', async () => {
    const { service, galleryRepository } = setup();
    galleryRepository.save.mockResolvedValue({ id: 'g1' });
    await expect(service.create({ image: 'a.png' } as any)).resolves.toEqual({ id: 'g1' });
  });

  it('throws on create failure', async () => {
    const { service, galleryRepository } = setup();
    galleryRepository.save.mockRejectedValue(new Error('bad'));
    await expect(service.create({} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds one gallery', async () => {
    const { service, galleryRepository } = setup();
    galleryRepository.findOneOrFail.mockResolvedValue({ id: 'g1' });
    await expect(service.findOne('g1')).resolves.toEqual({ id: 'g1' });
  });

  it('throws not found on findOne failure', async () => {
    const { service, galleryRepository } = setup();
    galleryRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.findOne('g1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes gallery and deletes image file', async () => {
    const { service, galleryRepository } = setup();
    const unlinkSpy = jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'g1', image: 'old.png' } as any);
    galleryRepository.delete.mockResolvedValue(undefined);
    await expect(service.remove('g1')).resolves.toBeUndefined();
    expect(unlinkSpy).toHaveBeenCalledWith('./uploads/galleries/old.png');
    expect(galleryRepository.delete).toHaveBeenCalledWith('g1');
  });

  it('throws on remove failure', async () => {
    const { service } = setup();
    jest.spyOn(service, 'findOne').mockRejectedValue(new Error('bad'));
    await expect(service.remove('g1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds galleries by dynamic repo and venture gallery', async () => {
    const { service, galleryRepository } = setup();
    galleryRepository.find.mockResolvedValue([{ id: 'g1' }]);
    await expect(service.findGallery('product', 'slug')).resolves.toEqual([{ id: 'g1' }]);
    await expect(service.findVentureGallery('slug')).resolves.toEqual([{ id: 'g1' }]);
  });
});
