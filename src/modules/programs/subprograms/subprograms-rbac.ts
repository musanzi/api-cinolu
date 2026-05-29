import { Role } from '../../auth/enums/roles.enum';
import { ModuleRbacPolicy } from '@musanzi/nestjs-session-auth';

export const SUBPROGRAMS_RBAC_POLICY: ModuleRbacPolicy = {
  module: 'subprograms',
  grants: [
    {
      roles: [Role.STAFF],
      actions: ['read', 'create', 'update', 'delete'],
      resources: ['subprograms']
    }
  ]
};
