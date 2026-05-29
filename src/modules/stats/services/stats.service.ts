import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../../identity/users/entities/user.entity';
import { Venture } from '../../ventures/ventures/entities/venture.entity';
import { IUSerStats } from '../types/user-stats.type';
import {
  IAdminStatsGeneral,
  IAdminStatsByYear,
  IProgramParticipations,
  ISubprogramParticipations,
  IParticipationItem
} from '../types/admin-stats.type';
import { Project } from '../../projects/projects/entities/project.entity';
import { Event } from '../../events/events/entities/event.entity';
import { Program } from '../../programs/programs/entities/program.entity';
import { ProjectParticipation } from '../../projects/projects/entities/project-participation.entity';
import { EventParticipation } from '../../events/events/entities/event-participation.entity';

@Injectable()
export class StatsService {
  constructor(private readonly dataSource: DataSource) {}

  async findUserStats(user: User): Promise<IUSerStats> {
    const [totalVentures, referralsCount] = await Promise.all([
      this.countUserVentures(user.id),
      this.countUserReferrals(user.id)
    ]);
    return { totalVentures, referralsCount };
  }

  async findAdminStatsGeneral(): Promise<IAdminStatsGeneral> {
    const [totalUsers, totalProjects, totalEvents, totalVentures] = await Promise.all([
      this.dataSource.getRepository(User).count(),
      this.dataSource.getRepository(Project).count(),
      this.dataSource.getRepository(Event).count(),
      this.dataSource.getRepository(Venture).count()
    ]);
    return { totalUsers, totalProjects, totalEvents, totalVentures };
  }

  async findAdminStatsByYear(year: number): Promise<IAdminStatsByYear> {
    const [totalProjectParticipations, totalEventParticipations, detailedParticipations] = await Promise.all([
      this.countProjectParticipationsByYear(year),
      this.countEventParticipationsByYear(year),
      this.buildDetailedParticipations(year)
    ]);
    return {
      year,
      summary: {
        totalProjectParticipations,
        totalEventParticipations,
        totalParticipations: totalProjectParticipations + totalEventParticipations
      },
      detailedParticipations
    };
  }

  private async buildDetailedParticipations(year: number): Promise<{
    programs: IProgramParticipations[];
  }> {
    const [programs, projectCounts, eventCounts] = await Promise.all([
      this.dataSource.getRepository(Program).find({
        relations: ['subprograms', 'subprograms.projects', 'subprograms.events']
      }),
      this.dataSource
        .getRepository(ProjectParticipation)
        .createQueryBuilder('pp')
        .select('pp.projectId', 'projectId')
        .addSelect('COUNT(*)', 'count')
        .where('YEAR(pp.created_at) = :year', { year })
        .groupBy('pp.projectId')
        .getRawMany<{ projectId: string; count: string }>(),
      this.dataSource
        .getRepository(EventParticipation)
        .createQueryBuilder('ep')
        .select('ep.eventId', 'eventId')
        .addSelect('COUNT(*)', 'count')
        .where('YEAR(ep.created_at) = :year', { year })
        .groupBy('ep.eventId')
        .getRawMany<{ eventId: string; count: string }>()
    ]);
    const projectCountMap = new Map(projectCounts.map((row) => [row.projectId, Number(row.count)]));
    const eventCountMap = new Map(eventCounts.map((row) => [row.eventId, Number(row.count)]));
    const programsList: IProgramParticipations[] = programs.map((program) => {
      const subs = program.subprograms ?? [];
      const subprogramsList: ISubprogramParticipations[] = subs.map((sub) => {
        const projectsList: IParticipationItem[] = (sub.projects ?? []).map((proj) => {
          const count = projectCountMap.get(proj.id) ?? 0;
          return { id: proj.id, name: proj.name, participations: count };
        });
        const eventsList: IParticipationItem[] = (sub.events ?? []).map((evt) => {
          const count = eventCountMap.get(evt.id) ?? 0;
          return { id: evt.id, name: evt.name, participations: count };
        });
        const subParticipations =
          projectsList.reduce((s, p) => s + p.participations, 0) + eventsList.reduce((s, e) => s + e.participations, 0);
        return {
          id: sub.id,
          name: sub.name,
          participations: subParticipations,
          projects: projectsList,
          events: eventsList
        };
      });
      const programTotal = subprogramsList.reduce((s, sp) => s + sp.participations, 0);
      return {
        id: program.id,
        name: program.name,
        participations: programTotal,
        subprograms: subprogramsList
      };
    });
    return { programs: programsList };
  }

  private async countProjectParticipationsByYear(year: number): Promise<number> {
    return this.dataSource
      .getRepository(ProjectParticipation)
      .createQueryBuilder('pp')
      .where('YEAR(pp.created_at) = :year', { year })
      .getCount();
  }

  private async countEventParticipationsByYear(year: number): Promise<number> {
    return this.dataSource
      .getRepository(EventParticipation)
      .createQueryBuilder('ep')
      .where('YEAR(ep.created_at) = :year', { year })
      .getCount();
  }

  private async countUserVentures(userId: string): Promise<number> {
    return await this.dataSource.getRepository(Venture).count({
      where: { owner: { id: userId } }
    });
  }

  private async countUserReferrals(userId: string): Promise<number> {
    return await this.dataSource.getRepository(User).count({
      where: { referred_by: { id: userId } }
    });
  }
}
