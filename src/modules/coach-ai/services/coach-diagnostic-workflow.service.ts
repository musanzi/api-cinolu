import { BadRequestException, Injectable } from '@nestjs/common';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { Venture } from '@/modules/ventures/entities/venture.entity';
import { AiCoach } from '../entities/ai-coach.entity';
import { CoachOutput } from '../types/coach-output.type';
import { CoachLlmService } from './coach-llm.service';
import { CoachOutputValidatorService } from './coach-output-validator.service';

const DiagnosticState = Annotation.Root({
  systemPrompt: Annotation<string>,
  userPrompt: Annotation<string>,
  rawResponse: Annotation<string>,
  output: Annotation<CoachOutput>
});

@Injectable()
export class CoachDiagnosticWorkflowService {
  constructor(
    private readonly llmService: CoachLlmService,
    private readonly validatorService: CoachOutputValidatorService
  ) {}

  async run(coach: AiCoach, venture: Venture): Promise<CoachOutput> {
    try {
      const graph = new StateGraph(DiagnosticState)
        .addNode('prepare', async () => ({
          systemPrompt: this.buildSystemPrompt(coach, venture),
          userPrompt: this.buildUserPrompt(venture)
        }))
        .addNode('generate', async (state) => ({
          rawResponse: await this.llmService.generate(state.systemPrompt, state.userPrompt)
        }))
        .addNode('validate', async (state) => ({
          output: this.validatorService.validate(state.rawResponse, coach, venture)
        }))
        .addEdge(START, 'prepare')
        .addEdge('prepare', 'generate')
        .addEdge('generate', 'validate')
        .addEdge('validate', END)
        .compile();
      const result = await graph.invoke({
        systemPrompt: '',
        userPrompt: '',
        rawResponse: '',
        output: null
      });
      return result.output;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Diagnostic impossible');
    }
  }

  private buildSystemPrompt(coach: AiCoach, venture: Venture): string {
    return [
      `Tu es ${coach.name}.`,
      `Profil: ${coach.profile}`,
      `Role: ${coach.role}`,
      `Sorties autorisees: ${coach.expected_outputs.join(', ')}`,
      `Venture: ${venture.name}`,
      `Description: ${venture.description}`,
      `Probleme resolu: ${venture.problem_solved}`,
      `Marche cible: ${venture.target_market}`,
      `Secteur: ${venture.sector || 'non defini'}`,
      `Stade: ${venture.stage || 'non defini'}`,
      "Reponds uniquement en JSON valide avec les cles: type, title, summary, bullets, ventureFocus, scopeCheck.",
      "scopeCheck doit contenir profile, role et grounded=true.",
      'Ne reponds jamais hors de ton perimetre.'
    ].join('\n');
  }

  private buildUserPrompt(venture: Venture): string {
    return [
      `Fais un diagnostic initial de la venture ${venture.name}.`,
      'Le type doit etre DIAGNOSTIC.',
      "Les bullets doivent contenir les constats prioritaires et les premieres actions."
    ].join('\n');
  }
}
