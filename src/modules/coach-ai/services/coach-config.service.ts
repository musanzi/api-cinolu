import { Injectable } from '@nestjs/common';
import { Venture } from '@/modules/ventures/entities/venture.entity';

type CoachDefinition = {
  name: string;
  profile: string;
  role: string;
  expectedOutputs: string[];
};

@Injectable()
export class CoachConfigService {
  buildDefinition(venture: Venture): CoachDefinition {
    const sector = venture.sector || 'activité générale';
    const stage = venture.stage || 'stade non défini';
    return {
      name: `Coach diagnostic ${venture.name}`,
      profile: `Coach stratégique spécialisé dans l'accompagnement des entrepreneurs du secteur ${sector}.`,
      role: `Diagnostiquer la venture ${venture.name}, identifier les risques prioritaires et proposer des actions concrètes adaptées au stade ${stage}.`,
      expectedOutputs: ['DIAGNOSTIC', 'RECOMMENDATIONS', 'RISKS', 'NEXT_ACTIONS', 'CLARIFICATION']
    };
  }
}
