import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubprogramsService } from '@/modules/programs/subprograms/services/subprograms.service';

describe('SubprogramsService', () => {
  const setup = () => {
    const subprogramRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneOrFail: jest.fn(),
      merge: jest.fn((entity, dto) => ({ ...entity, ...dto })),
      softDelete: jest.fn()
    } as any;
    const service = new SubprogramsService(subprogramRepository);
    return { service, subprogramRepository };
  };

  it('creates subprogram', async () => {
    const { service, subprogramRepository } = setup();
    subprogramRepository.create.mockReturnValue({ name: 'Sub' });
    subprogramRepository.save.mockResolvedValue({ id: 's1' });
    await expect(service.create({ name: 'Sub', programId: 'p1' } as any)).resolves.toEqual({ id: 's1' });
    expect(subprogramRepository.create).toHaveBeenCalledWith(expect.objectContaining({ program: { id: 'p1' } }));
  });

  it('throws on create failure', async () => {
    const { service, subprogramRepository } = setup();
    subprogramRepository.create.mockImplementation(() => {
      throw new Error('bad');
    });
    await expect(service.create({} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds subprograms by program', async () => {
    const { service, subprogramRepository } = setup();
    subprogramRepository.find.mockResolvedValue([{ id: 's1' }]);
    await expect(service.findByProgram('p1')).resolves.toEqual([{ id: 's1' }]);
  });

  it('throws on findByProgram failure', async () => {
    const { service, subprogramRepository } = setup();
    subprogramRepository.find.mockRejectedValue(new Error('bad'));
    await expect(service.findByProgram('p1')).rejects.toThrow('bad');
  });

  it('finds all subprograms', async () => {
    const { service, subprogramRepository } = setup();
    subprogramRepository.find.mockResolvedValue([{ id: 's1' }]);
    await expect(service.findAll()).resolves.toEqual([{ id: 's1' }]);
  });

  it('finds subprogram by slug', async () => {
    const { service, subprogramRepository } = setup();
    subprogramRepository.findOneOrFail.mockResolvedValue({ id: 's1', slug: 'slug' });
    await expect(service.findBySlug('slug')).resolves.toEqual({ id: 's1', slug: 'slug' });
  });

  it('throws on findBySlug failure', async () => {
    const { service, subprogramRepository } = setup();
    subprogramRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.findBySlug('slug')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('toggles highlight', async () => {
    const { service, subprogramRepository } = setup();
    subprogramRepository.findOneOrFail.mockResolvedValue({ id: 's1', is_highlighted: false });
    subprogramRepository.save.mockResolvedValue({ id: 's1', is_highlighted: true });
    await expect(service.highlight('s1')).resolves.toEqual({ id: 's1', is_highlighted: true });
  });

  it('toggles publish', async () => {
    const { service, subprogramRepository } = setup();
    subprogramRepository.findOneOrFail.mockResolvedValue({ id: 's1', is_published: false });
    subprogramRepository.save.mockResolvedValue({ id: 's1', is_published: true });
    await expect(service.togglePublish('s1')).resolves.toEqual({ id: 's1', is_published: true });
  });

  it('sets logo', async () => {
    const { service, subprogramRepository } = setup();
    subprogramRepository.findOneOrFail.mockResolvedValue({ id: 's1', logo: null });
    subprogramRepository.save.mockResolvedValue({ id: 's1', logo: 'logo.png' });
    await expect(service.setLogo('s1', 'logo.png')).resolves.toEqual({ id: 's1', logo: 'logo.png' });
  });

  it('finds one by id', async () => {
    const { service, subprogramRepository } = setup();
    subprogramRepository.findOneOrFail.mockResolvedValue({ id: 's1' });
    await expect(service.findOne('s1')).resolves.toEqual({ id: 's1' });
  });

  it('throws on findOne failure', async () => {
    const { service, subprogramRepository } = setup();
    subprogramRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.findOne('s1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates subprogram', async () => {
    const { service, subprogramRepository } = setup();
    subprogramRepository.findOneOrFail.mockResolvedValue({ id: 's1', program: { id: 'p1' } });
    subprogramRepository.save.mockResolvedValue({ id: 's1', name: 'new' });
    await expect(service.update('s1', { name: 'new', programId: 'p2' } as any)).resolves.toEqual({
      id: 's1',
      name: 'new'
    });
  });

  it('throws on update failure', async () => {
    const { service, subprogramRepository } = setup();
    subprogramRepository.findOneOrFail.mockResolvedValue({ id: 's1' });
    subprogramRepository.save.mockRejectedValue(new Error('bad'));
    await expect(service.update('s1', {} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('removes subprogram', async () => {
    const { service, subprogramRepository } = setup();
    subprogramRepository.softDelete.mockResolvedValue(undefined);
    await expect(service.remove('s1')).resolves.toBeUndefined();
  });
});
