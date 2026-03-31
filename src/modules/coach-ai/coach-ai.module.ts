import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VenturesModule } from '@/modules/ventures/ventures.module';
import { AiCoach } from './entities/ai-coach.entity';
import { CoachConversation } from './entities/coach-conversation.entity';
import { CoachMessage } from './entities/coach-message.entity';
import { CoachAiController } from './controllers/coach-ai.controller';
import { CoachAiService } from './services/coach-ai.service';
import { CoachConfigService } from './services/coach-config.service';
import { CoachConversationWorkflowService } from './services/coach-conversation-workflow.service';
import { CoachDiagnosticWorkflowService } from './services/coach-diagnostic-workflow.service';
import { CoachLlmService } from './services/coach-llm.service';
import { CoachOutputValidatorService } from './services/coach-output-validator.service';
import { CoachStoreService } from './services/coach-store.service';
import { CoachConversationsService } from './services/coach-conversations.service';
import { CoachMessagesService } from './services/coach-messages.service';

@Module({
  imports: [TypeOrmModule.forFeature([AiCoach, CoachConversation, CoachMessage]), VenturesModule],
  controllers: [CoachAiController],
  providers: [
    CoachAiService,
    CoachConfigService,
    CoachConversationWorkflowService,
    CoachDiagnosticWorkflowService,
    CoachLlmService,
    CoachOutputValidatorService,
    CoachStoreService,
    CoachConversationsService,
    CoachMessagesService
  ],
  exports: [CoachAiService]
})
export class CoachAiModule {}
