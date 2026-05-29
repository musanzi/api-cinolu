import { Role } from '../../auth/enums/roles.enum';
import { ModuleRbacPolicy } from '@musanzi/nestjs-session-auth';

export const VENTURES_RBAC_POLICY: ModuleRbacPolicy = {
  module: 'ventures',
  grants: [
    {
      roles: [Role.STAFF],
      actions: ['create', 'read', 'update', 'delete'],
      resources: ['ventures', 'products', 'publishVenture']
    },
    {
      roles: [Role.USER],
      actions: ['create', 'update'],
      resources: ['ventures', 'products'],
    }
  ]
};
