import { Role } from '../../auth/enums/roles.enum';
import { ModuleRbacPolicy } from '@musanzi/nestjs-session-auth';

export const USERS_RBAC_POLICY: ModuleRbacPolicy = {
  module: 'users',
  grants: [
    {
      roles: [Role.STAFF],
      actions: ['create', 'read', 'update', 'delete'],
      resources: ['users', 'roles', 'exportUsersCSV']
    }
  ]
};
