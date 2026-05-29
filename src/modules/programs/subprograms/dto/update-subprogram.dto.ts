import { PartialType } from '@nestjs/swagger';
import { CreateSubprogramDto } from './create-subprogram.dto';

export class UpdateSubprogramDto extends PartialType(CreateSubprogramDto) {}
