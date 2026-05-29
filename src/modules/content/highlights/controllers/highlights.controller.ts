import { Controller, Get } from '@nestjs/common';
import { HighlightsService } from '../highlights.service';
import { Public } from '@musanzi/nestjs-session-auth';
import { HighlightedItems } from '../types';

@Controller('highlights')
export class HighlightsController {
  constructor(private highlightsService: HighlightsService) {}

  @Get()
  @Public()
  async findAll(): Promise<HighlightedItems> {
    return await this.highlightsService.findAll();
  }
}
