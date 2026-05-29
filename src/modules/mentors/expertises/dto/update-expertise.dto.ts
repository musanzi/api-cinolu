import { PartialType } from '@nestjs/swagger';
import { CreateExpertiseDto } from './create-expertise.dto';

export class UpdateExpertiseDto extends PartialType(CreateExpertiseDto) {}
