import { BadRequestException, ConflictException } from '@nestjs/common';
import { RolesService } from '../../src/modules/identity/roles/roles.service';

function createQueryBuilder(result: [any[], number]) {
  return {
    orderBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue(result)
  };
}

describe('RolesService', () => {
  let roleRepository: any;
  let service: RolesService;

  beforeEach(() => {
    roleRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOneOrFail: jest.fn(),
      createQueryBuilder: jest.fn(),
      delete: jest.fn()
    };
    service = new RolesService(roleRepository);
  });

  it('create persists role', async () => {
    roleRepository.save.mockResolvedValue({ id: 'r1', name: 'staff' });
    await expect(service.create({ name: 'staff' } as any)).resolves.toEqual({ id: 'r1', name: 'staff' });
  });

  it('create maps repository error to ConflictException', async () => {
    roleRepository.save.mockRejectedValue(new Error('duplicate'));
    await expect(service.create({ name: 'staff' } as any)).rejects.toBeInstanceOf(ConflictException);
  });

  it('signUpRoles filters out admin and staff', async () => {
    roleRepository.find.mockResolvedValue([{ name: 'user' }]);
    await expect(service.signUpRoles()).resolves.toEqual([{ name: 'user' }]);
    expect(roleRepository.find).toHaveBeenCalledWith(expect.objectContaining({ where: expect.any(Object) }));
  });

  it('signUpRoles maps repository errors to BadRequestException', async () => {
    roleRepository.find.mockRejectedValue(new Error('db'));
    await expect(service.signUpRoles()).rejects.toBeInstanceOf(BadRequestException);
  });

  it('findAllPaginated applies query and page window', async () => {
    const qb = createQueryBuilder([[{ id: 'r1' }], 1]);
    roleRepository.createQueryBuilder.mockReturnValue(qb);

    await expect(service.findAllPaginated({ page: 2, q: 'st' } as any)).resolves.toEqual([[{ id: 'r1' }], 1]);
    expect(qb.where).toHaveBeenCalledWith('role.name LIKE :name', { name: '%st%' });
    expect(qb.skip).toHaveBeenCalledWith(40);
    expect(qb.take).toHaveBeenCalledWith(40);
  });

  it('findAllPaginated skips search filter when query is missing', async () => {
    const qb = createQueryBuilder([[{ id: 'r1' }], 1]);
    roleRepository.createQueryBuilder.mockReturnValue(qb);

    await expect(service.findAllPaginated({} as any)).resolves.toEqual([[{ id: 'r1' }], 1]);
    expect(qb.where).not.toHaveBeenCalled();
    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(qb.take).toHaveBeenCalledWith(40);
  });

  it('findByName maps errors to BadRequestException', async () => {
    roleRepository.findOneOrFail.mockRejectedValue(new Error('missing'));
    await expect(service.findByName('none')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('findOne maps repository errors to BadRequestException', async () => {
    roleRepository.findOneOrFail.mockRejectedValue(new Error('missing'));
    await expect(service.findOne('none')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('update merges role and dto then saves', async () => {
    roleRepository.findOneOrFail.mockResolvedValue({ id: 'r1', name: 'user' });
    roleRepository.save.mockResolvedValue({ id: 'r1', name: 'mentor' });

    await expect(service.update('r1', { name: 'mentor' } as any)).resolves.toEqual({ id: 'r1', name: 'mentor' });
    expect(roleRepository.save).toHaveBeenCalledWith({ id: 'r1', name: 'mentor' });
  });

  it('remove deletes existing role', async () => {
    roleRepository.findOneOrFail.mockResolvedValue({ id: 'r1' });
    roleRepository.delete.mockResolvedValue({});

    await expect(service.remove('r1')).resolves.toBeUndefined();
    expect(roleRepository.delete).toHaveBeenCalledWith('r1');
  });

  it('remove maps errors to BadRequestException', async () => {
    roleRepository.findOneOrFail.mockRejectedValue(new Error('missing'));
    await expect(service.remove('r1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
