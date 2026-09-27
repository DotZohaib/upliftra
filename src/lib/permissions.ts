import { UserRole, RolePermission } from '../types';
import { getCurrentUser, getRolePermissions } from './storage';
import { ROLE_PERMISSIONS_MATRIX } from '../data/seedData';

export const ROLE_PERMISSIONS = ROLE_PERMISSIONS_MATRIX;

export type PermissionKey =
  | 'viewOpportunities'
  | 'applyOpportunities'
  | 'postOpportunities'
  | 'requestMentorship'
  | 'offerMentorship'
  | 'createCourses'
  | 'moderateCommunity'
  | 'managePlatformData'
  | 'accessSuperAdmin';

export function getPermissionsForRole(role: UserRole): RolePermission | undefined {
  const all = getRolePermissions();
  return all.find((p) => p.role === role);
}

export function hasPermission(permission: PermissionKey, role?: UserRole): boolean {
  const currentRole = role || getCurrentUser().role;
  // Super Admin always has full bypass access
  if (currentRole === 'Super Admin') return true;

  const rolePerm = getPermissionsForRole(currentRole);
  if (!rolePerm) return false;

  return Boolean(rolePerm[permission]);
}

export function hasRole(allowedRoles: UserRole[], role?: UserRole): boolean {
  const currentRole = role || getCurrentUser().role;
  return allowedRoles.includes(currentRole);
}

export function isAdmin(role?: UserRole): boolean {
  const currentRole = role || getCurrentUser().role;
  return currentRole === 'Admin' || currentRole === 'Super Admin';
}

export function isSuperAdmin(role?: UserRole): boolean {
  const currentRole = role || getCurrentUser().role;
  return currentRole === 'Super Admin';
}

export function isModerator(role?: UserRole): boolean {
  const currentRole = role || getCurrentUser().role;
  return currentRole === 'Moderator' || currentRole === 'Admin' || currentRole === 'Super Admin';
}

export function isRecruiterOrCompany(role?: UserRole): boolean {
  const currentRole = role || getCurrentUser().role;
  return currentRole === 'Recruiter' || currentRole === 'Company' || currentRole === 'Startup/Founder' || currentRole === 'Admin' || currentRole === 'Super Admin';
}

export function isMentor(role?: UserRole): boolean {
  const currentRole = role || getCurrentUser().role;
  return currentRole === 'Mentor' || currentRole === 'Trainer' || currentRole === 'Admin' || currentRole === 'Super Admin';
}

export function canAccessPath(path: string, role?: UserRole): boolean {
  const currentRole = role || getCurrentUser().role;

  // Super Admin has unrestricted access to everything
  if (currentRole === 'Super Admin') return true;

  switch (path) {
    // Exclusive to Super Admin
    case 'super-admin':
      return isSuperAdmin(currentRole);

    // Admin + Super Admin only
    case 'admin-portal':
      return isAdmin(currentRole);

    // Moderator + Admin + Super Admin
    case 'moderation-hub':
      return isModerator(currentRole);

    // SECURITY FIX: These tools expose raw platform data — Admin only, NOT Partner/University
    case 'local-data-excel-manager':
      return isAdmin(currentRole);

    // RBAC matrix is admin governance — Admin only
    case 'settings-rbac-permissions':
      return isAdmin(currentRole);

    // Everyone authenticated can see role-based portal hub
    case 'role-based-portals':
      return true;

    // All other paths are accessible to any authenticated user
    default:
      return true;
  }
}
