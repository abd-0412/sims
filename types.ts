
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF'
}

export type TransactionType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'IN' | 'OUT' | 'RETURN';

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

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  permissions: PermissionAction[];
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  rating: number;
  isActive: boolean;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  modelNumber: string;
  specifications: string;
  categoryId: string;
  categoryName?: string;
  brandId: string | null;
  brandName?: string;
  supplierId: string | null;
  supplierName?: string;
  unit: string;
  reorderLevel: number;
  overstockLevel: number;
  currentStock: number;
  costPrice: number;
  sellingPrice: number;
  totalSold: number;
  totalReturned: number;
  totalRevenue: number;
  status: 'ACTIVE' | 'DISCONTINUED' | 'BLOCKED';
  isActive: boolean;
  deletedAt?: string | null;
  createdAt: string;
}

export interface WarehouseStock {
  id: string;
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  updatedAt: string;
}

export interface StockTransaction {
  id: string;
  productId: string;
  productName?: string;
  warehouseId?: string;
  warehouseName?: string;
  type: TransactionType;
  quantity: number;
  supplierId?: string;
  supplierName?: string;
  purchaseCost: number;
  customerName: string;
  sellingPriceAtSale: number;
  profit: number;
  reason: string;
  remarks?: string;
  isAnomaly: boolean;
  requestId?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}

export type ActionType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'PRODUCT_CREATE'
  | 'PRODUCT_UPDATE'
  | 'PRODUCT_DELETE'
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'STOCK_ADJUST'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'CATEGORY_CREATE'
  | 'CATEGORY_UPDATE'
  | 'CATEGORY_DELETE'
  | 'BRAND_CREATE'
  | 'BRAND_UPDATE'
  | 'BRAND_DELETE'
  | 'SUPPLIER_CREATE'
  | 'SUPPLIER_UPDATE'
  | 'SUPPLIER_DELETE'
  | 'WAREHOUSE_CREATE'
  | 'WAREHOUSE_UPDATE'
  | 'WAREHOUSE_DELETE'
  | 'CSV_EXPORT'
  | 'SECURITY_UPDATE';

export interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  action: ActionType;
  entity: string;
  entityId?: string;
  message: string;
  createdAt: string;
}

export interface AlertItem {
  id: string;
  type: 'LOW_STOCK' | 'OVERSTOCK' | 'DEAD_STOCK' | 'STOCK_OUT';
  productId: string;
  productName: string;
  warehouseId?: string;
  warehouseName?: string;
  message: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ACTIVE' | 'RESOLVED';
  isRead: boolean;
  createdAt: string;
}
