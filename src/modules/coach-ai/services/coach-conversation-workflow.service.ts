import { BadRequestException, Injectable } from '@nestjs/common';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { Venture } from '@/modules/ventures/entities/venture.entity';
import { AiCoach } from '../entities/ai-coach.entity';
import { CoachMessage } from '../entities/coach-message.entity';
import { CoachOutput } from '../types/coach-output.type';
import { CoachLlmService } from './coach-llm.service';
import { CoachOutputValidatorService } from './coach-output-validator.service';

const ConversationState = Annotation.Root({
  systemPrompt: Annotation<string>,
  userPrompt: Annotation<string>,
  rawResponse: Annotation<string>,
  output: Annotation<CoachOutput>
});

@Injectable()
export class CoachConversationWorkflowService {
  constructor(
    private readonly llmService: CoachLlmService,
    private readonly validatorService: CoachOutputValidatorService
  ) {}

  async run(coach: AiCoach, venture: Venture, prompt: string, history: CoachMessage[]): Promise<CoachOutput> {
    try {
      const graph = new StateGraph(ConversationState)
        .addNode('prepare', async () => ({
          systemPrompt: this.buildSystemPrompt(coach, venture),
          userPrompt: this.buildUserPrompt(prompt, history)
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
      throw new BadRequestException('Conversation impossible');
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
      "Reponds uniquement en JSON valide avec les cles: type, title, summary, bullets, ventureFocus, scopeCheck.",
      "Choisis le type le plus adapte parmi les sorties autorisees.",
      'Si la question sort du perimetre, reponds avec le type CLARIFICATION et recadre la demande.'
    ].join('\n');
  }

  private buildUserPrompt(prompt: string, history: CoachMessage[]): string {
    const recentHistory = history
      .slice(-6)
      .map((message) => `${message.role}: ${message.content}`)
      .join('\n');
    return [`Historique recent:`, recentHistory || 'Aucun historique', '', `Question: ${prompt}`].join('\n');
  }
}
