import { Module } from '@nestjs/common';
import { HighlightsController } from './controllers/highlights.controller';
import { HighlightsService } from './services/highlights.service';

@Module({
  controllers: [HighlightsController],
  providers: [HighlightsService]
})
export class HighlightsModule {}
