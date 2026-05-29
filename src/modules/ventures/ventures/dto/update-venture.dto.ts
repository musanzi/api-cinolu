import { PartialType } from '@nestjs/mapped-types';
import { CreateVentureDto } from './create-venture.dto';

export class UpdateVentureDto extends PartialType(CreateVentureDto) {}
