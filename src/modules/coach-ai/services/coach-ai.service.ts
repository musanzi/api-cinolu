import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { User } from '@/modules/users/entities/user.entity';
import { Venture } from '@/modules/ventures/entities/venture.entity';
import { VenturesService } from '@/modules/ventures/services/ventures.service';
import { CreateCoachMessageDto } from '../dto/create-coach-message.dto';
import { AiCoach } from '../entities/ai-coach.entity';
import { CoachConversation } from '../entities/coach-conversation.entity';
import { CoachConfigService } from './coach-config.service';
import { CoachConversationWorkflowService } from './coach-conversation-workflow.service';
import { CoachDiagnosticWorkflowService } from './coach-diagnostic-workflow.service';
import { CoachOutput } from '../types/coach-output.type';
import { CoachStoreService } from './coach-store.service';
import { CoachConversationsService } from './coach-conversations.service';
import { CoachMessagesService } from './coach-messages.service';

@Injectable()
export class CoachAiService {
  constructor(
    private readonly venturesService: VenturesService,
    private readonly coachStoreService: CoachStoreService,
    private readonly conversationsService: CoachConversationsService,
    private readonly messagesService: CoachMessagesService,
    private readonly configService: CoachConfigService,
    private readonly diagnosticWorkflow: CoachDiagnosticWorkflowService,
    private readonly conversationWorkflow: CoachConversationWorkflowService
  ) {}

  @OnEvent('venture.created')
  async handleVentureCreated(venture: Venture): Promise<void> {
    try {
      await this.assignCoachToVenture(venture);
    } catch {
      throw new BadRequestException('Création du coach impossible');
    }
  }

  async findCoachForVenture(ventureId: string, user: User): Promise<AiCoach> {
    try {
      const venture = await this.ensureOwner(ventureId, user.id);
      return await this.findCoachEntity(venture.id);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new NotFoundException('Coach introuvable');
    }
  }

  async findConversation(ventureId: string, user: User): Promise<CoachConversation> {
    try {
      const venture = await this.ensureOwner(ventureId, user.id);
      const coach = await this.findCoachEntity(venture.id);
      return await this.findConversationEntity(coach.id, venture.id);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new NotFoundException('Conversation introuvable');
    }
  }

  async chat(ventureId: string, user: User, dto: CreateCoachMessageDto): Promise<CoachOutput> {
    try {
      const venture = await this.ensureOwner(ventureId, user.id);
      const coach = await this.findOrAssignCoach(venture);
      const conversation = await this.findOrCreateConversation(coach, venture);
      const history = await this.messagesService.findByConversation(conversation.id);
      await this.messagesService.createUserMessage(conversation.id, dto.message);
      const output = await this.conversationWorkflow.run(coach, venture, dto.message, history);
      await this.messagesService.createCoachMessage(conversation.id, output);
      return output;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException('Message impossible');
    }
  }

  async assignCoachToVenture(venture: Venture): Promise<AiCoach> {
    try {
      const existingCoach = await this.coachStoreService.findByVenture(venture.id);
      if (existingCoach) return existingCoach;
      const definition = this.configService.buildDefinition(venture);
      const coach = await this.coachStoreService.create({
        name: definition.name,
        profile: definition.profile,
        role: definition.role,
        expectedOutputs: definition.expectedOutputs,
        ventureId: venture.id
      });
      const conversation = await this.findOrCreateConversation(coach, venture);
      const output = await this.diagnosticWorkflow.run(coach, venture);
      await this.messagesService.createCoachMessage(conversation.id, output);
      return await this.coachStoreService.findByVentureOrFail(venture.id);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Attribution du coach impossible');
    }
  }

  private async ensureOwner(ventureId: string, userId: string): Promise<Venture> {
    try {
      const venture = await this.venturesService.findOne(ventureId);
      if (venture.owner?.id !== userId) {
        throw new BadRequestException('Accès au coach refusé');
      }
      return venture;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new NotFoundException('Venture introuvable');
    }
  }

  private async findOrAssignCoach(venture: Venture): Promise<AiCoach> {
    try {
      return await this.findCoachEntity(venture.id);
    } catch {
      return await this.assignCoachToVenture(venture);
    }
  }

  private async findCoachEntity(ventureId: string): Promise<AiCoach> {
    return await this.coachStoreService.findByVentureOrFail(ventureId);
  }

  private async findConversationEntity(coachId: string, ventureId: string): Promise<CoachConversation> {
    return await this.conversationsService.findByCoachAndVentureOrFail(coachId, ventureId);
  }

  private async findOrCreateConversation(coach: AiCoach, venture: Venture): Promise<CoachConversation> {
    const existingConversation = await this.conversationsService.findByCoachAndVenture(coach.id, venture.id);
    if (existingConversation) return existingConversation;
    return await this.conversationsService.create(coach.id, venture.id);
  }
}
