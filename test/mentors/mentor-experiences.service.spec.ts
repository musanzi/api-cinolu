import { BadRequestException } from '@nestjs/common';
import { MentorExperiencesService } from '@/modules/mentors/mentors/services/mentor-experiences.service';

describe('MentorExperiencesService', () => {
  const setup = () => {
    const experienceRepository = {
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    } as any;
    const service = new MentorExperiencesService(experienceRepository);
    return { service, experienceRepository };
  };

  it('updates existing and creates new experiences, then removes stale ones', async () => {
    const { service, experienceRepository } = setup();
    experienceRepository.find.mockResolvedValue([
      { id: 'e1', role: 'old role' },
      { id: 'e2', role: 'to delete' }
    ]);
    experienceRepository.save
      .mockResolvedValueOnce({ id: 'e1', role: 'updated' })
      .mockResolvedValueOnce({ id: 'e3', role: 'new' });
    experienceRepository.delete.mockResolvedValue(undefined);

    const result = await service.saveExperiences('m1', [
      { id: 'e1', role: 'updated' } as any,
      { role: 'new', start_date: '2025-01-01', end_date: '2025-12-31' } as any
    ]);

    expect(result).toEqual([
      { id: 'e1', role: 'updated' },
      { id: 'e3', role: 'new' }
    ]);
    expect(experienceRepository.delete).toHaveBeenCalledWith(['e2']);
  });

  it('does not delete when all existing are processed', async () => {
    const { service, experienceRepository } = setup();
    experienceRepository.find.mockResolvedValue([{ id: 'e1', role: 'old role' }]);
    experienceRepository.save.mockResolvedValue({ id: 'e1', role: 'updated' });

    await service.saveExperiences('m1', [{ id: 'e1', role: 'updated' } as any]);
    expect(experienceRepository.delete).not.toHaveBeenCalled();
  });

  it('throws bad request on repository error', async () => {
    const { service, experienceRepository } = setup();
    experienceRepository.find.mockRejectedValue(new Error('bad'));
    await expect(service.saveExperiences('m1', [] as any)).rejects.toBeInstanceOf(BadRequestException);
  });
});
