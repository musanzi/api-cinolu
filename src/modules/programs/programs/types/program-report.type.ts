export interface IndicatorReport {
  name: string;
  target: number | null;
  achieved: number;
  category: string;
  performance: number;
}

export interface CategoryPerformance {
  category: string;
  performance: number;
}

export interface ProgramReport {
  name: string;
  categories: CategoryPerformance[];
}
