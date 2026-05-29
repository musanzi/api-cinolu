import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { format } from 'fast-csv';
import { Response } from 'express';
import { User } from '../entities/user.entity';
import { FilterUsersDto } from '../dto/filter-users.dto';

@Injectable()
export class UsersExportService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async exportCSV(queryParams: FilterUsersDto, res: Response): Promise<void> {
    try {
      const { q } = queryParams;
      const query = this.userRepository
        .createQueryBuilder('user')
        .select(['user.name', 'user.email', 'user.phone_number'])
        .orderBy('user.updated_at', 'DESC');
      if (q) {
        query.where('user.name LIKE :q OR user.email LIKE :q', { q: `%${q}%` });
      }
      const users = await query.getMany();
      const csvStream = format({ headers: ['Name', 'Email', 'Phone Number'] });
      csvStream.pipe(res);
      users.forEach((user) => {
        csvStream.write({ Name: user.name, Email: user.email, 'Phone Number': user.phone_number });
      });
      csvStream.end();
    } catch {
      throw new BadRequestException("Export des utilisateurs impossible");
    }
  }
}
