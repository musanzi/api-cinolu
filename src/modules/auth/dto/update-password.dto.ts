import { MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @MinLength(6)
  password: string;
}
