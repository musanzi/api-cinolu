import { IsNotEmpty } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty({ message: 'Le nom du rôle est obligatoire' })
  name: string;
}
