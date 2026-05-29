export interface IAdminStatsGeneral {
  totalUsers: number;
  totalProjects: number;
  totalEvents: number;
  totalVentures: number;
}

export interface IParticipationItem {
  id: string;
  name: string;
  participations: number;
}

export interface ISubprogramParticipations {
  id: string;
  name: string;
  participations: number;
  projects: IParticipationItem[];
  events: IParticipationItem[];
}

export interface IProgramParticipations {
  id: string;
  name: string;
  participations: number;
  subprograms: ISubprogramParticipations[];
}

export interface IAdminStatsByYear {
  year: number;
  summary: {
    totalProjectParticipations: number;
    totalEventParticipations: number;
    totalParticipations: number;
  };
  detailedParticipations: {
    programs: IProgramParticipations[];
  };
}
