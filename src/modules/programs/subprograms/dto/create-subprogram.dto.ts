import { IsNotEmpty } from 'class-validator';

export class CreateSubprogramDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  programId: string;
}
