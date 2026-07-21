import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators';
import { Roles } from '../enums';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Roles[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;
    return requiredRoles.some((role) => user.roles?.includes(role) || user.roles?.includes(Roles.ADMIN));
  }
}
