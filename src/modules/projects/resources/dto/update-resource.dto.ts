import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateResourceDto } from './create-resource.dto';

export class UpdateResourceDto extends PartialType(OmitType(CreateResourceDto, ['project_id', 'phase_id'] as const)) {}
