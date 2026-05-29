import { Type } from 'class-transformer';
import { CreateExperienceDto } from './create-experience.dto';
import { IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { MentorType } from '../enums/mentor.enum';

export class MentorRequestDto {
  years_experience: number;
  expertises: string[];

  @IsOptional()
  @IsEnum(MentorType)
  type?: MentorType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExperienceDto)
  experiences: CreateExperienceDto[];
}
