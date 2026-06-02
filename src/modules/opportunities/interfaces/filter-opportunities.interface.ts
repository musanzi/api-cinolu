import { OpportunityLanguage } from '../entities/opportunity.entity';

export interface FilterOpportunitiesInterface {
  from?: string;
  to?: string;
  language?: OpportunityLanguage;
}
