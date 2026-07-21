import { SetMetadata } from '@nestjs/common';
import { Roles } from '../enums/roles.enum';

export const ROLES_KEY = 'HasRoles';
export const HasRoles = (roles: Roles[]) => SetMetadata(ROLES_KEY, roles);
