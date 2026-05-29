import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MentorStatus } from '../../src/modules/mentors/mentors/enums/mentor.enum';
import { MentorsService } from '../../src/modules/mentors/mentors/services/mentors.service';

describe('MentorsService', () => {
  const makeQueryBuilder = (result: [any[], number] = [[], 0]) => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue(result)
  });

  const setup = () => {
    const queryBuilder = makeQueryBuilder([[{ id: 'm1' }], 1]);
    const mentorRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOneOrFail: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      update: jest.fn(),
      softDelete: jest.fn()
    } as any;
    const usersService = {
      findByEmail: jest.fn(),
      assignRole: jest.fn(),
      update: jest.fn()
    } as any;
    const experiencesService = { saveExperiences: jest.fn() } as any;
    const eventEmitter = { emit: jest.fn() } as any;
    const service = new MentorsService(mentorRepository, usersService, experiencesService, eventEmitter);
    return { service, mentorRepository, usersService, experiencesService, eventEmitter, queryBuilder };
  };

  it('submits mentor request and emits application event', async () => {
    const { service, eventEmitter } = setup();
    jest.spyOn(service as any, 'createProfile').mockResolvedValue({ id: 'm1' } as any);
    await expect(service.submitRequest({ id: 'u1' } as any, { bio: 'x' } as any)).resolves.toEqual({ id: 'm1' });
    expect(eventEmitter.emit).toHaveBeenCalledWith('mentor.application', { id: 'm1' });
  });

  it('updates mentor request and experiences', async () => {
    const { service, mentorRepository, experiencesService } = setup();
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValueOnce({ id: 'm1', expertises: [] } as any)
      .mockResolvedValueOnce({ id: 'm1', updated: true } as any);
    experiencesService.saveExperiences.mockResolvedValue(undefined);
    mentorRepository.save.mockResolvedValue(undefined);
    await expect(
      service.updateRequest('m1', { expertises: ['e1'], experiences: [{ role: 'r' }] } as any)
    ).resolves.toEqual({
      id: 'm1',
      updated: true
    });
  });

  it('finds mentors/users by phase with unique user mapping', async () => {
    const { service, mentorRepository } = setup();
    mentorRepository.find.mockResolvedValue([
      { owner: { id: 'u1' } },
      { owner: { id: 'u1' } },
      { owner: { id: 'u2' } }
    ]);
    await expect(service.findMentorsByPhase('phase-1')).resolves.toHaveLength(3);
    await expect(service.findUsersByPhase('phase-1')).resolves.toEqual([{ id: 'u1' }, { id: 'u2' }]);
  });

  it('creates approved mentor from email', async () => {
    const { service, usersService } = setup();
    usersService.findByEmail.mockResolvedValue({ id: 'u1' });
    usersService.assignRole.mockResolvedValue(undefined);
    jest.spyOn(service as any, 'createProfile').mockResolvedValue({ id: 'm1' } as any);
    await expect(service.create({ email: 'a@a.com', mentor: { bio: 'x' } } as any)).resolves.toEqual({ id: 'm1' });
  });

  it('updates full mentor profile', async () => {
    const { service, experiencesService, usersService, mentorRepository } = setup();
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValueOnce({ id: 'm1', owner: { id: 'u1' }, expertises: [] } as any)
      .mockResolvedValueOnce({ id: 'm1', done: true } as any);
    experiencesService.saveExperiences.mockResolvedValue(undefined);
    usersService.update.mockResolvedValue(undefined);
    mentorRepository.save.mockResolvedValue(undefined);
    await expect(
      service.updateMentor('m1', { user: {}, mentor: { expertises: ['x'], experiences: [] } } as any)
    ).resolves.toEqual({
      id: 'm1',
      done: true
    });
  });

  it('finds filtered mentors', async () => {
    const { service, queryBuilder } = setup();
    await expect(service.findFiltered({ q: 'john', status: MentorStatus.PENDING, page: 2 } as any)).resolves.toEqual([
      [{ id: 'm1' }],
      1
    ]);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('owner.name LIKE :search', { search: '%john%' });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('m.status = :status', { status: MentorStatus.PENDING });
    expect(queryBuilder.skip).toHaveBeenCalledWith(10);
  });

  it('finds approved mentors', async () => {
    const { service, mentorRepository } = setup();
    mentorRepository.find.mockResolvedValue([{ id: 'm1' }]);
    await expect(service.findApproved()).resolves.toEqual([{ id: 'm1' }]);
  });

  it('approves mentor and emits event', async () => {
    const { service, mentorRepository, usersService, eventEmitter } = setup();
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValueOnce({ id: 'm1', owner: { id: 'u1' } } as any)
      .mockResolvedValueOnce({ id: 'm1', status: MentorStatus.APPROVED } as any);
    mentorRepository.update.mockResolvedValue(undefined);
    usersService.assignRole.mockResolvedValue(undefined);
    await expect(service.approve('m1')).resolves.toEqual({ id: 'm1', status: MentorStatus.APPROVED });
    expect(eventEmitter.emit).toHaveBeenCalledWith('mentor.approved', { id: 'm1', owner: { id: 'u1' } });
  });

  it('rejects mentor and emits event', async () => {
    const { service, mentorRepository, usersService, eventEmitter } = setup();
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValueOnce({ id: 'm1', owner: { id: 'u1' } } as any)
      .mockResolvedValueOnce({ id: 'm1', status: MentorStatus.REJECTED } as any);
    mentorRepository.update.mockResolvedValue(undefined);
    usersService.assignRole.mockResolvedValue(undefined);
    await expect(service.reject('m1')).resolves.toEqual({ id: 'm1', status: MentorStatus.REJECTED });
    expect(eventEmitter.emit).toHaveBeenCalledWith('mentor.rejected', { id: 'm1', status: MentorStatus.REJECTED });
  });

  it('finds by user and by id', async () => {
    const { service, mentorRepository } = setup();
    mentorRepository.find.mockResolvedValue([{ id: 'm1' }]);
    mentorRepository.findOneOrFail.mockResolvedValue({ id: 'm1' });
    await expect(service.findByUser({ id: 'u1' } as any)).resolves.toEqual([{ id: 'm1' }]);
    await expect(service.findOne('m1')).resolves.toEqual({ id: 'm1' });
  });

  it('updates request profile and remove/add cv', async () => {
    const { service, experiencesService, mentorRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'm1', expertises: [], cv: null } as any);
    experiencesService.saveExperiences.mockResolvedValue(undefined);
    mentorRepository.save.mockResolvedValue({ id: 'm1', cv: 'cv.pdf' });
    await expect(service.update('m1', { experiences: [], expertises: [] } as any)).resolves.toEqual({
      id: 'm1',
      cv: 'cv.pdf'
    });
    await expect(service.addCv('m1', 'cv.pdf')).resolves.toEqual({ id: 'm1', cv: 'cv.pdf' });
  });

  it('removes mentor profile', async () => {
    const { service, mentorRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'm1' } as any);
    mentorRepository.softDelete.mockResolvedValue(undefined);
    await expect(service.remove('m1')).resolves.toBeUndefined();
  });

  it('wraps service failures', async () => {
    const { service, mentorRepository } = setup();
    mentorRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.findOne('m1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.approve('m1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
