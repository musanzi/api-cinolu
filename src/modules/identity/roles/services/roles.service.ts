import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterRolesInterface } from '../interfaces/filter-roles.interface';
import { AbstractRepository } from '@/modules/database/abstract.repository';

@Injectable()
export class RolesService extends AbstractRepository<Role> {
  constructor(
    @InjectRepository(Role)
    repository: Repository<Role>
  ) {
    super(repository);
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    return await this.createEntity(dto);
  }

  async findAllPaginated(queryParams: FilterRolesInterface): Promise<[Role[], number]> {
    const { page = 1, q } = queryParams;
    const query = this.repository.createQueryBuilder('role').orderBy('role.updated_at', 'DESC');
    if (q) query.where('role.name LIKE :name', { name: `%${q}%` });
    return await this.findPaginatedEntities(query, { page, take: 40 });
  }

  async findAll(): Promise<Role[]> {
    return await this.findEntities({
      order: { updated_at: 'DESC' }
    });
  }

  async findByName(name: string): Promise<Role> {
    return await this.findEntity({ where: { name } });
  }

  async findOne(id: string): Promise<Role> {
    return await this.findEntity({ where: { id } });
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    return await this.updateEntity(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.hardDeleteEntity(id);
  }
}
