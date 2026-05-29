import { BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { ResourceMediaService } from '@/modules/projects/resources/services/resource-media.service';

describe('ResourceMediaService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const setup = () => {
    const resourcesService = {
      findOne: jest.fn(),
      setFile: jest.fn()
    } as any;
    const service = new ResourceMediaService(resourcesService);
    return { service, resourcesService };
  };

  it('replaces file and deletes old resource file when present', async () => {
    const { service, resourcesService } = setup();
    const unlinkSpy = jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
    resourcesService.findOne.mockResolvedValue({ id: 'r1', file: 'old.pdf' });
    resourcesService.setFile.mockResolvedValue({ id: 'r1', file: 'new.pdf' });

    await expect(service.updateFile('r1', { filename: 'new.pdf' } as any)).resolves.toEqual({
      id: 'r1',
      file: 'new.pdf'
    });
    expect(unlinkSpy).toHaveBeenCalledWith('./uploads/resources/old.pdf');
  });

  it('replaces file without unlink when there is no previous file', async () => {
    const { service, resourcesService } = setup();
    const unlinkSpy = jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
    resourcesService.findOne.mockResolvedValue({ id: 'r1', file: null });
    resourcesService.setFile.mockResolvedValue({ id: 'r1', file: 'new.pdf' });

    await expect(service.updateFile('r1', { filename: 'new.pdf' } as any)).resolves.toEqual({
      id: 'r1',
      file: 'new.pdf'
    });
    expect(unlinkSpy).not.toHaveBeenCalled();
  });

  it('wraps failures in bad request', async () => {
    const { service, resourcesService } = setup();
    resourcesService.findOne.mockRejectedValue(new Error('bad'));
    await expect(service.updateFile('r1', { filename: 'new.pdf' } as any)).rejects.toBeInstanceOf(BadRequestException);
  });
});
