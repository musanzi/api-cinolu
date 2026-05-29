import { Role } from '../../auth/enums/roles.enum';
import { ModuleRbacPolicy } from '@musanzi/nestjs-session-auth';

export const BLOG_RBAC_POLICY: ModuleRbacPolicy = {
  module: 'blog',
  grants: [
    { roles: [Role.USER, Role.MENTOR], actions: ['update', 'delete'], resources: ['comments'] },
    { roles: [Role.STAFF], actions: ['read', 'create', 'update', 'delete'], resources: ['blogs', 'tags', 'comments'] }
  ]
};
