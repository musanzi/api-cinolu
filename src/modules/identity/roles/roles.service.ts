import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { In, Not, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterRolesDto } from './dto/filter-roles.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>
  ) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    try {
      return await this.roleRepository.save(dto);
    } catch {
      throw new ConflictException('Création du rôle impossible');
    }
  }

  async signUpRoles(): Promise<Role[]> {
    try {
      return await this.roleRepository.find({
        where: { name: Not(In(['admin', 'staff'])) }
      });
    } catch {
      throw new BadRequestException('Rôles introuvables');
    }
  }

  async findAllPaginated(queryParams: FilterRolesDto): Promise<[Role[], number]> {
    const { page = 1, q } = queryParams;
    const query = this.roleRepository.createQueryBuilder('role').orderBy('role.updated_at', 'DESC');
    if (q) query.where('role.name LIKE :name', { name: `%${q}%` });
    return await query
      .skip((+page - 1) * 40)
      .take(40)
      .getManyAndCount();
  }

  async findAll(): Promise<Role[]> {
    return await this.roleRepository.find({
      order: { updated_at: 'DESC' }
    });
  }

  async findByName(name: string): Promise<Role> {
    try {
      return await this.roleRepository.findOneOrFail({ where: { name } });
    } catch {
      throw new BadRequestException('Rôle introuvable');
    }
  }

  async findOne(id: string): Promise<Role> {
    try {
      return await this.roleRepository.findOneOrFail({ where: { id } });
    } catch {
      throw new BadRequestException('Rôle introuvable');
    }
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    try {
      const role = await this.findOne(id);
      const updatedRole: Role & UpdateRoleDto = Object.assign(role, dto);
      return await this.roleRepository.save(updatedRole);
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.findOne(id);
      await this.roleRepository.delete(id);
    } catch {
      throw new BadRequestException('Suppression impossible');
    }
  }
}
