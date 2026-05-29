import { Role } from '../../auth/enums/roles.enum';
import { ModuleRbacPolicy } from '@musanzi/nestjs-session-auth';

export const EVENTS_RBAC_POLICY: ModuleRbacPolicy = {
  module: 'events',
  grants: [
    { roles: [Role.STAFF], actions: ['read', 'create', 'update', 'delete'], resources: ['events', 'eventCategories'] }
  ]
};
