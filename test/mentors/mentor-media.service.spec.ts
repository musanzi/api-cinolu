import { BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { MentorMediaService } from '../../src/modules/mentors/mentors/services/mentor-media.service';

describe('MentorMediaService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const setup = () => {
    const mentorsService = {
      findOne: jest.fn(),
      addCv: jest.fn()
    } as any;
    const service = new MentorMediaService(mentorsService);
    return { service, mentorsService };
  };

  it('adds cv and deletes old file when present', async () => {
    const { service, mentorsService } = setup();
    const unlinkSpy = jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
    mentorsService.findOne.mockResolvedValue({ id: 'm1', cv: 'old.pdf' });
    mentorsService.addCv.mockResolvedValue({ id: 'm1', cv: 'new.pdf' });
    await expect(service.addCv('m1', { filename: 'new.pdf' } as any)).resolves.toEqual({ id: 'm1', cv: 'new.pdf' });
    expect(unlinkSpy).toHaveBeenCalledWith('./uploads/mentors/cvs/old.pdf');
  });

  it('adds cv without unlink when no previous cv', async () => {
    const { service, mentorsService } = setup();
    const unlinkSpy = jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
    mentorsService.findOne.mockResolvedValue({ id: 'm1', cv: null });
    mentorsService.addCv.mockResolvedValue({ id: 'm1', cv: 'new.pdf' });
    await service.addCv('m1', { filename: 'new.pdf' } as any);
    expect(unlinkSpy).not.toHaveBeenCalled();
  });

  it('wraps failures in bad request', async () => {
    const { service, mentorsService } = setup();
    mentorsService.findOne.mockRejectedValue(new Error('bad'));
    await expect(service.addCv('m1', { filename: 'x.pdf' } as any)).rejects.toBeInstanceOf(BadRequestException);
  });
});
