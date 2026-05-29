import { BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { ProjectMediaService } from '@/modules/projects/projects/services/project-media.service';

describe('ProjectMediaService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const setup = () => {
    const galleriesService = {
      create: jest.fn(),
      remove: jest.fn(),
      findGallery: jest.fn()
    } as any;
    const projectsService = {
      findOne: jest.fn(),
      addCover: jest.fn()
    } as any;
    const service = new ProjectMediaService(galleriesService, projectsService);
    return { service, galleriesService, projectsService };
  };

  it('adds image to project gallery', async () => {
    const { service, projectsService, galleriesService } = setup();
    projectsService.findOne.mockResolvedValue({ id: 'proj1' });
    galleriesService.create.mockResolvedValue(undefined);
    await expect(service.addImage('proj1', { filename: 'img.png' } as any)).resolves.toBeUndefined();
    expect(galleriesService.create).toHaveBeenCalledWith({ image: 'img.png', project: { id: 'proj1' } });
  });

  it('removes image from gallery', async () => {
    const { service, galleriesService } = setup();
    galleriesService.remove.mockResolvedValue(undefined);
    await expect(service.removeImage('g1')).resolves.toBeUndefined();
  });

  it('finds project gallery', async () => {
    const { service, galleriesService } = setup();
    galleriesService.findGallery.mockResolvedValue([{ id: 'g1' }]);
    await expect(service.findGallery('slug')).resolves.toEqual([{ id: 'g1' }]);
  });

  it('adds cover and deletes old cover file when present', async () => {
    const { service, projectsService } = setup();
    const unlinkSpy = jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
    projectsService.findOne.mockResolvedValue({ id: 'proj1', cover: 'old.png' });
    projectsService.addCover.mockResolvedValue({ id: 'proj1', cover: 'new.png' });
    await expect(service.addCover('proj1', { filename: 'new.png' } as any)).resolves.toEqual({
      id: 'proj1',
      cover: 'new.png'
    });
    expect(unlinkSpy).toHaveBeenCalledWith('./uploads/projects/old.png');
  });

  it('adds cover without unlink when no previous cover', async () => {
    const { service, projectsService } = setup();
    const unlinkSpy = jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
    projectsService.findOne.mockResolvedValue({ id: 'proj1', cover: null });
    projectsService.addCover.mockResolvedValue({ id: 'proj1', cover: 'new.png' });
    await service.addCover('proj1', { filename: 'new.png' } as any);
    expect(unlinkSpy).not.toHaveBeenCalled();
  });

  it('wraps failures in bad request', async () => {
    const { service, projectsService } = setup();
    projectsService.findOne.mockRejectedValue(new Error('bad'));
    await expect(service.addImage('proj1', { filename: 'x.png' } as any)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.addCover('proj1', { filename: 'x.png' } as any)).rejects.toBeInstanceOf(BadRequestException);
  });
});
