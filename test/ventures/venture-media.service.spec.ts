import { BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { VentureMediaService } from '@/modules/ventures/ventures/services/venture-media.service';

describe('VentureMediaService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const setup = () => {
    const galleriesService = {
      create: jest.fn(),
      remove: jest.fn(),
      findGallery: jest.fn()
    } as any;
    const venturesService = {
      findOne: jest.fn(),
      setLogo: jest.fn(),
      setCover: jest.fn()
    } as any;
    const service = new VentureMediaService(galleriesService, venturesService);
    return { service, galleriesService, venturesService };
  };

  it('adds image to venture gallery', async () => {
    const { service, venturesService, galleriesService } = setup();
    venturesService.findOne.mockResolvedValue({ id: 'v1' });
    galleriesService.create.mockResolvedValue(undefined);
    await expect(service.addImage('v1', { filename: 'img.png' } as any)).resolves.toBeUndefined();
    expect(galleriesService.create).toHaveBeenCalledWith({ image: 'img.png', venture: { id: 'v1' } });
  });

  it('removes image from gallery', async () => {
    const { service, galleriesService } = setup();
    galleriesService.remove.mockResolvedValue(undefined);
    await expect(service.removeImage('g1')).resolves.toBeUndefined();
  });

  it('finds venture gallery', async () => {
    const { service, galleriesService } = setup();
    galleriesService.findGallery.mockResolvedValue([{ id: 'g1' }]);
    await expect(service.findGallery('venture-slug')).resolves.toEqual([{ id: 'g1' }]);
  });

  it('adds logo and removes old logo file when present', async () => {
    const { service, venturesService } = setup();
    const unlinkSpy = jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
    venturesService.findOne.mockResolvedValue({ id: 'v1', logo: 'old.png' });
    venturesService.setLogo.mockResolvedValue({ id: 'v1', logo: 'new.png' });
    await expect(service.addLogo('v1', { filename: 'new.png' } as any)).resolves.toEqual({ id: 'v1', logo: 'new.png' });
    expect(unlinkSpy).toHaveBeenCalledWith('./uploads/ventures/logos/old.png');
  });

  it('adds logo without unlink when there is no old logo', async () => {
    const { service, venturesService } = setup();
    const unlinkSpy = jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
    venturesService.findOne.mockResolvedValue({ id: 'v1', logo: null });
    venturesService.setLogo.mockResolvedValue({ id: 'v1', logo: 'new.png' });
    await service.addLogo('v1', { filename: 'new.png' } as any);
    expect(unlinkSpy).not.toHaveBeenCalled();
  });

  it('adds cover and removes old cover file when present', async () => {
    const { service, venturesService } = setup();
    const unlinkSpy = jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
    venturesService.findOne.mockResolvedValue({ id: 'v1', cover: 'old-cover.png' });
    venturesService.setCover.mockResolvedValue({ id: 'v1', cover: 'new-cover.png' });
    await expect(service.addCover('v1', { filename: 'new-cover.png' } as any)).resolves.toEqual({
      id: 'v1',
      cover: 'new-cover.png'
    });
    expect(unlinkSpy).toHaveBeenCalledWith('./uploads/ventures/covers/old-cover.png');
  });

  it('wraps failures in bad request', async () => {
    const { service, venturesService } = setup();
    venturesService.findOne.mockRejectedValue(new Error('bad'));
    await expect(service.addImage('v1', { filename: 'img.png' } as any)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.addLogo('v1', { filename: 'new.png' } as any)).rejects.toBeInstanceOf(BadRequestException);
  });
});
