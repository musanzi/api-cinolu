import { Role } from '../../auth/enums/roles.enum';
import { ModuleRbacPolicy } from '@musanzi/nestjs-session-auth';

export const MENTORS_RBAC_POLICY: ModuleRbacPolicy = {
  module: 'mentors',
  grants: [
    { roles: [Role.USER, Role.MENTOR], actions: ['update', 'delete'], resources: ['mentors'] },
    { roles: [Role.STAFF], actions: ['read', 'create', 'update', 'delete'], resources: ['mentors', 'expertises'] }
  ]
};
