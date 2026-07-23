import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * @Roles decorator - Restricts access to specific roles.
 *
 * Usage:
 * @Roles('admin')
 * @Roles('admin', 'member')
 * @Roles('admin', 'manager', 'member')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
