
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product, Category, Brand, Supplier, Warehouse, WarehouseStock, User, StockTransaction, AuditLog, AlertItem, UserRole, ActionType, TransactionType } from '../types';
import api from '../services/api';

interface Notification {
  message: string;
  type: 'success' | 'error' | 'warning';
  id: number;
}

interface InventoryContextType {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  warehouseStock: WarehouseStock[];
  users: User[];
  transactions: StockTransaction[];
  logs: AuditLog[];
  alerts: AlertItem[];
  notifications: Notification[];
  isLoading: boolean;

  addProduct: (p: any, userId: string) => Promise<void>;
  updateProduct: (id: string, p: Partial<Product>, userId: string) => Promise<void>;
  deleteProduct: (id: string, userId: string) => Promise<void>;
  addCategory: (data: { name: string, description?: string }, userId: string) => Promise<void>;
  updateCategory: (id: string, data: { name: string, description?: string }, userId: string) => Promise<void>;
  deleteCategory: (id: string, userId: string) => Promise<void>;
  addBrand: (data: { name: string, website?: string }, userId: string) => Promise<void>;
  updateBrand: (id: string, data: any, userId: string) => Promise<void>;
  deleteBrand: (id: string, userId: string) => Promise<void>;
  addSupplier: (data: any, userId: string) => Promise<void>;
  updateSupplier: (id: string, data: any, userId: string) => Promise<void>;
  deleteSupplier: (id: string, userId: string) => Promise<void>;
  addWarehouse: (data: { name: string, location?: string }, userId: string) => Promise<void>;
  updateWarehouse: (id: string, data: any, userId: string) => Promise<void>;
  deleteWarehouse: (id: string, userId: string) => Promise<void>;
  processStockMovement: (type: TransactionType, productId: string, qty: number, reason: string, remarks: string, userId: string, warehouseId?: string, supplierId?: string, purchaseCost?: number, customerName?: string, sellingPriceAtSale?: number) => Promise<boolean>;
  addUser: (u: any, adminId: string) => Promise<void>;
  updateUser: (id: string, u: any, adminId: string) => Promise<void>;
  deleteUser: (id: string, adminId: string) => Promise<void>;
  markAlertRead: (id: string) => Promise<void>;
  notify: (message: string, type: 'success' | 'error' | 'warning') => void;
  removeNotification: (id: number) => void;
  createLog: (userId: string, action: ActionType, entity: string, entityId: string | undefined, message: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseStock, setWarehouseStock] = useState<WarehouseStock[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [notifiedAlertIds, setNotifiedAlertIds] = useState<Set<string>>(new Set());

  const notify = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { message, type, id }]);
    setTimeout(() => removeNotification(id), 5000);
  }, []);

  // Automated Alert Relay
  useEffect(() => {
    if (isFirstLoad) return;
    const freshAlerts = alerts.filter(a => !a.isRead && !notifiedAlertIds.has(a.id));
    if (freshAlerts.length > 0) {
      freshAlerts.forEach(alert => {
        const type = alert.priority === 'HIGH' ? 'error' : 'warning';
        notify(`Stock Alert: ${alert.message}`, type);
        setNotifiedAlertIds(prev => new Set(prev).add(alert.id));
      });
    }
  }, [alerts, notifiedAlertIds, notify, isFirstLoad]);

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const refreshData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoading(true);
    try {
      await api.get('/health');
      const [pRes, cRes, bRes, sRes, wRes, wsRes, uRes, tRes, lRes, aRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/brands'),
        api.get('/suppliers'),
        api.get('/warehouses'),
        api.get('/warehouse-stock'),
        api.get('/users'),
        api.get('/transactions'),
        api.get('/logs'),
        api.get('/alerts')
      ]);
      setProducts(pRes.data);
      setCategories(cRes.data);
      setBrands(bRes.data);
      setSuppliers(sRes.data);
      setWarehouses(wRes.data);
      setWarehouseStock(wsRes.data);
      setUsers(uRes.data);
      setTransactions(tRes.data);
      setLogs(lRes.data);
      setAlerts(aRes.data);
      
      if (isFirstLoad) {
        const initialIds = new Set(aRes.data.map((a: any) => a.id));
        setNotifiedAlertIds(initialIds);
        setIsFirstLoad(false);
      }
    } catch (err: any) {
      if (err.response?.status === 401) return;
      if (!err.response) {
        notify("Server offline. Run 'node server.js' in a terminal.", "error");
      } else {
        notify(`Server error: ${err.response.data?.message || 'Unknown error'}`, "error");
      }
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => { refreshData(); }, [refreshData]);

  const createLog = async (userId: string, action: ActionType, entity: string, entityId: string | undefined, message: string) => {
    try {
      await api.post('/logs', { userId, action, entity, entityId, message });
      const lRes = await api.get('/logs');
      setLogs(lRes.data);
    } catch (err) { console.error("Failed to create log", err); }
  };

  // ── Products ──
  const addProduct = async (p: any, userId: string) => {
    try {
      await api.post('/products', { ...p, createdBy: userId });
      await refreshData();
      notify('Product created successfully.', 'success');
    } catch (err: any) { notify(err.response?.data?.message || 'Failed to create product.', 'error'); }
  };
  const updateProduct = async (id: string, updates: Partial<Product>, userId: string) => {
    try {
      await api.put(`/products/${id}`, { ...updates, userId });
      await refreshData();
      notify('Product updated successfully.', 'success');
    } catch (err) { notify('Failed to update product.', 'error'); }
  };
  const deleteProduct = async (id: string, userId: string) => {
    try {
      await api.delete(`/products/${id}`, { data: { userId } });
      await refreshData();
      notify('Product deactivated.', 'success');
    } catch (err: any) { notify(err.response?.data?.message || 'Failed to delete product.', 'error'); }
  };

  // ── Categories ──
  const addCategory = async (data: { name: string, description?: string }, userId: string) => {
    try {
      await api.post('/categories', { ...data, userId });
      await refreshData();
      notify(`Category "${data.name}" created.`, 'success');
    } catch (err) { notify('Failed to create category.', 'error'); }
  };
  const updateCategory = async (id: string, data: { name: string, description?: string }, userId: string) => {
    try {
      await api.put(`/categories/${id}`, { ...data, userId });
      await refreshData();
    } catch (err) { notify('Failed to update category.', 'error'); }
  };
  const deleteCategory = async (id: string, userId: string) => {
    try {
      await api.delete(`/categories/${id}`, { data: { userId } });
      await refreshData();
      notify('Category deactivated (products also deactivated).', 'success');
    } catch (err: any) { notify(err.response?.data?.message || 'Failed to delete category.', 'error'); }
  };

  // ── Brands ──
  const addBrand = async (data: { name: string, website?: string }, userId: string) => {
    try {
      await api.post('/brands', { ...data, userId });
      await refreshData();
      notify(`Brand "${data.name}" created.`, 'success');
    } catch (err) { notify('Failed to create brand.', 'error'); }
  };
  const updateBrand = async (id: string, data: any, userId: string) => {
    try {
      await api.put(`/brands/${id}`, { ...data, userId });
      await refreshData();
    } catch (err) { notify('Failed to update brand.', 'error'); }
  };
  const deleteBrand = async (id: string, userId: string) => {
    try {
      await api.delete(`/brands/${id}`, { data: { userId } });
      await refreshData();
      notify('Brand deactivated.', 'success');
    } catch (err: any) { notify(err.response?.data?.message || 'Failed to delete brand.', 'error'); }
  };

  // ── Suppliers ──
  const addSupplier = async (data: any, userId: string) => {
    try {
      await api.post('/suppliers', { ...data, userId });
      await refreshData();
      notify(`Supplier "${data.name}" created.`, 'success');
    } catch (err) { notify('Failed to create supplier.', 'error'); }
  };
  const updateSupplier = async (id: string, data: any, userId: string) => {
    try {
      await api.put(`/suppliers/${id}`, { ...data, userId });
      await refreshData();
    } catch (err) { notify('Failed to update supplier.', 'error'); }
  };
  const deleteSupplier = async (id: string, userId: string) => {
    try {
      await api.delete(`/suppliers/${id}`, { data: { userId } });
      await refreshData();
      notify('Supplier deactivated.', 'success');
    } catch (err: any) { notify(err.response?.data?.message || 'Failed to delete supplier.', 'error'); }
  };

  // ── Warehouses ──
  const addWarehouse = async (data: { name: string, location?: string }, userId: string) => {
    try {
      await api.post('/warehouses', { ...data, userId });
      await refreshData();
      notify(`Warehouse "${data.name}" created.`, 'success');
    } catch (err) { notify('Failed to create warehouse.', 'error'); }
  };
  const updateWarehouse = async (id: string, data: any, userId: string) => {
    try {
      await api.put(`/warehouses/${id}`, { ...data, userId });
      await refreshData();
    } catch (err) { notify('Failed to update warehouse.', 'error'); }
  };
  const deleteWarehouse = async (id: string, userId: string) => {
    try {
      await api.delete(`/warehouses/${id}`, { data: { userId } });
      await refreshData();
      notify('Warehouse deactivated.', 'success');
    } catch (err: any) { notify(err.response?.data?.message || 'Failed to delete warehouse.', 'error'); }
  };

  // ── Transactions ──
  const processStockMovement = async (type: TransactionType, productId: string, qty: number, reason: string, remarks: string, userId: string, warehouseId?: string, supplierId?: string, purchaseCost?: number, customerName?: string, sellingPriceAtSale?: number) => {
    try {
      await api.post('/transactions', { type, productId, quantity: qty, reason, remarks, userId, warehouseId, supplierId, purchaseCost, customerName, sellingPriceAtSale });
      await refreshData();
      notify('Transaction processed successfully.', 'success');
      return true;
    } catch (err: any) {
      notify(err.response?.data?.message || 'Transaction failed.', 'error');
      return false;
    }
  };

  // ── Users ──
  const addUser = async (u: any, adminId: string) => {
    try {
      await api.post('/users', { ...u, adminId });
      await refreshData();
      notify('User created successfully.', 'success');
    } catch (err) { notify('Failed to create user.', 'error'); }
  };
  const updateUser = async (id: string, u: any, adminId: string) => {
    try {
      await api.put(`/users/${id}`, { ...u, adminId });
      await refreshData();
      notify('User updated.', 'success');
    } catch (err) { notify('Failed to update user.', 'error'); }
  };
  const deleteUser = async (id: string, adminId: string) => {
    try {
      await api.delete(`/users/${id}`, { data: { adminId } });
      await refreshData();
      notify('User deactivated.', 'success');
    } catch (err) { notify('Failed to delete user.', 'error'); }
  };

  // ── Alerts ──
  const markAlertRead = async (id: string) => {
    try {
      await api.put(`/alerts/${id}/read`);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
    } catch (err) { console.error('Failed to mark alert as read'); }
  };

  return (
    <InventoryContext.Provider value={{
      products, categories, brands, suppliers, warehouses, warehouseStock, users, transactions, logs, alerts, notifications, isLoading,
      addProduct, updateProduct, deleteProduct,
      addCategory, updateCategory, deleteCategory,
      addBrand, updateBrand, deleteBrand,
      addSupplier, updateSupplier, deleteSupplier,
      addWarehouse, updateWarehouse, deleteWarehouse,
      processStockMovement, notify, removeNotification, createLog,
      addUser, updateUser, deleteUser, markAlertRead, refreshData
    }}>
      {children}
      <div className="fixed top-8 right-4 lg:right-8 z-[9999] flex flex-col gap-4 pointer-events-none max-w-[calc(100vw-2rem)] sm:max-w-sm">
        {notifications.map(n => (
          <div key={n.id} className={`pointer-events-auto px-6 py-4 lg:px-8 lg:py-5 rounded-2xl shadow-2xl border-2 flex items-center gap-4 animate-in slide-in-from-right-10 duration-500 ${n.type === 'success' ? 'bg-white border-emerald-500 text-slate-950 shadow-emerald-500/20' :
              n.type === 'error' ? 'bg-rose-950 border-rose-500 text-white shadow-rose-950/40' :
                'bg-amber-100 border-amber-500 text-amber-950 shadow-amber-500/20'
            }`}>
            <i className={`fa-solid ${n.type === 'success' ? 'fa-circle-check text-emerald-500' : n.type === 'error' ? 'fa-triangle-exclamation text-rose-500' : 'fa-triangle-exclamation text-amber-600'}`}></i>
            <span className="font-black text-[10px] lg:text-xs uppercase tracking-widest leading-tight">{n.message}</span>
          </div>
        ))}
      </div>
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};
