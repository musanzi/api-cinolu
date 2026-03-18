import { Role } from '@/core/auth/enums/roles.enum';
import { ModuleRbacPolicy } from '@musanzi/nestjs-session-auth';

export const RESOURCES_RBAC_POLICY: ModuleRbacPolicy = {
  module: 'resources',
  grants: [
    {
      roles: [Role.STAFF, Role.ADMIN],
      actions: ['manage'],
      resources: ['resources']
    }
  ]
};
