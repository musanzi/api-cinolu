import { Controller, Get } from '@nestjs/common';
import { HighlightsService } from '../services/highlights.service';
import { HighlightedItems } from '../types';
import { Public } from '@/modules/auth/decorators';

@Controller('highlights')
export class HighlightsController {
  constructor(private highlightsService: HighlightsService) {}

  @Get()
  @Public()
  async findAll(): Promise<HighlightedItems> {
    return await this.highlightsService.findAll();
  }
}
