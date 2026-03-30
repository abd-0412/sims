
import { UserRole } from '../types';

export type PermissionAction = 
  | 'MANAGE_USERS' 
  | 'MANAGE_CATEGORIES' 
  | 'CREATE_PRODUCT' 
  | 'EDIT_PRODUCT' 
  | 'DELETE_PRODUCT' 
  | 'STOCK_IN' 
  | 'STOCK_OUT' 
  | 'STOCK_ADJUST' 
  | 'VIEW_REPORTS' 
  | 'EXPORT_DATA' 
  | 'VIEW_AUDIT_LOGS'
  | 'MANAGE_BRANDS'
  | 'MANAGE_SUPPLIERS'
  | 'MANAGE_WAREHOUSES';

// Default role-based permissions (fallback if user has no dynamic permissions)
const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  [UserRole.ADMIN]: [
    'MANAGE_USERS', 'MANAGE_CATEGORIES', 'CREATE_PRODUCT', 'EDIT_PRODUCT', 
    'DELETE_PRODUCT', 'STOCK_IN', 'STOCK_OUT', 'STOCK_ADJUST', 
    'VIEW_REPORTS', 'EXPORT_DATA', 'VIEW_AUDIT_LOGS',
    'MANAGE_BRANDS', 'MANAGE_SUPPLIERS', 'MANAGE_WAREHOUSES'
  ],
  [UserRole.MANAGER]: [
    'CREATE_PRODUCT', 'EDIT_PRODUCT', 'STOCK_IN', 'STOCK_OUT', 
    'VIEW_REPORTS', 'EXPORT_DATA', 'MANAGE_SUPPLIERS'
  ],
  [UserRole.STAFF]: [
    'STOCK_IN', 'STOCK_OUT'
  ]
};

export const hasPermission = (role: UserRole, action: PermissionAction, dynamicPermissions?: string[]): boolean => {
  // Check dynamic permissions first (from user's permissions array)
  if (dynamicPermissions && dynamicPermissions.length > 0) {
    return dynamicPermissions.includes(action);
  }
  // Fallback to role-based defaults
  return ROLE_PERMISSIONS[role]?.includes(action) || false;
};
