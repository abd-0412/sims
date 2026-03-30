import React, { useEffect, useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Menu, X, LayoutDashboard, Box, Layers, ShieldCheck, 
  ShoppingBag, TrendingUp, Users, LogOut, User as UserIcon,
  Plus, Minus, ArrowLeftRight, FileText, Settings, Bell, Search, Copyright, Truck, Warehouse
} from 'lucide-react';
import { UIProvider } from './context/UIContext';
import { useInventory, InventoryProvider } from './context/InventoryContext';
import { useUI } from './context/UIContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import BrandsPage from './pages/BrandsPage';
import SuppliersPage from './pages/SuppliersPage';
import WarehousesPage from './pages/WarehousesPage';
import StockInPage from './pages/StockInPage';
import StockOutPage from './pages/StockOutPage';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import AuditLogsPage from './pages/AuditLogsPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import { PopupModal, Badge, cn } from './components/UIComponents';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/products', icon: Box, label: 'Products' },
  { path: '/categories', icon: Layers, label: 'Categories' },
  { path: '/brands', icon: Copyright, label: 'Brands' },
  { path: '/suppliers', icon: Truck, label: 'Suppliers' },
  { path: '/warehouses', icon: Warehouse, label: 'Warehouses' },
  { path: '/stock-in', icon: Plus, label: 'Stock In' },
  { path: '/stock-out', icon: Minus, label: 'Stock Out' },
  { path: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/users', icon: Users, label: 'Users', adminOnly: true },
  { path: '/audit', icon: ShieldCheck, label: 'Audit Logs', adminOnly: true },
];

const Sidebar: React.FC<{ user: any; isOpen: boolean; onClose: () => void; onLogout: () => void }> = ({ user, isOpen, onClose, onLogout }) => {
  const location = useLocation();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 flex flex-col pt-4",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="px-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white">
              <Box className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">SIMS</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            if (item.adminOnly && user?.role !== 'ADMIN') return null;
            const isActive = item.path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-1",
                  isActive ? "bg-primary-600 text-white shadow-md shadow-primary-500/20" : "text-slate-300 hover:text-slate-100 hover:bg-slate-800"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link 
            to="/profile"
            onClick={() => onClose()}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 hover:text-white transition-all mb-1"
          >
            <UserIcon className="w-5 h-5 text-slate-400" />
            <span>Profile</span>
          </Link>
          <button 
            onClick={() => { onClose(); onLogout(); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold bg-red-50 hover:bg-red-500 text-red-600 hover:text-white transition-all shadow-sm active:scale-95"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout Account</span>
          </button>
        </div>
      </div>
    </>
  );
};

const Topbar: React.FC<{ user: any; onMenuClick: () => void; pageTitle: string }> = ({ user, onMenuClick, pageTitle }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { products, warehouses, alerts } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const results = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const pResults = products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 3);
    const wResults = warehouses.filter(w => w.name.toLowerCase().includes(q)).slice(0, 2);
    return [...pResults.map(p => ({ ...p, type: 'PRODUCT' })), ...wResults.map(w => ({ ...w, type: 'WAREHOUSE' }))];
  }, [searchQuery, products, warehouses]);

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick} className="lg:hidden text-slate-500 p-2 hover:bg-slate-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">{pageTitle}</h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-lg text-slate-500 text-sm font-medium transition-colors border border-transparent focus:border-primary-300"
          >
            <Search className="w-4 h-4" />
            <span className="opacity-60 font-semibold uppercase tracking-widest text-[10px]">Jump to Node...</span>
            <kbd className="text-[9px] font-black bg-white border border-slate-200 px-1 py-0.5 rounded ml-2 shadow-sm">Alt+S</kbd>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={cn("p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all relative", isNotifOpen && "bg-slate-100 text-slate-900")}
            >
              <Bell className="w-5 h-5" />
              {alerts.some(a => !a.isRead) && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
              )}
            </button>

            <AnimatePresence>
              {isNotifOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsNotifOpen(false)} 
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-premium z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">Intelligence Feed</h3>
                      <Badge variant="neutral" className="bg-white px-2 py-0.5 text-[9px]">
                        {alerts.filter(a => !a.isRead).length} NEW
                      </Badge>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-2 space-y-2">
                      {alerts.length > 0 ? (
                        alerts.map((alert) => (
                          <div key={alert.id} className={cn(
                            "flex gap-4 p-3 rounded-xl transition-colors border",
                            !alert.isRead ? "bg-amber-50/50 border-amber-100" : "hover:bg-slate-50 border-transparent"
                          )}>
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                              alert.priority === 'HIGH' ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                            )}>
                              {alert.type === 'LOW_STOCK' ? <ArrowLeftRight className="w-4 h-4 text-amber-600 rotate-90" /> : <Box className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-[11px] font-bold leading-tight uppercase tracking-tight",
                                alert.priority === 'HIGH' ? "text-rose-900" : "text-amber-900"
                              )}>{alert.type.replace(/_/g, ' ')}</p>
                              <p className="text-[10px] font-semibold text-slate-600 mt-0.5 line-clamp-2">{alert.message}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Alerts Detected</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="h-8 w-px bg-slate-200 mx-1"></div>

          <Link to="/profile" className="flex items-center gap-2 pl-2 group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-900 leading-none group-hover:text-primary-600 transition-colors">{user?.name}</p>
              <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{user?.role}</p>
            </div>
            <div className="w-9 h-9 bg-primary-900 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </Link>
        </div>
      </header>

      {/* Global Search Interface */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 sm:px-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-premium border border-slate-200 overflow-hidden"
            >
              <div className="relative">
                <Search className="absolute left-6 top-6 w-6 h-6 text-slate-400" />
                <input 
                  autoFocus
                  placeholder="Query SKUs, partner nodes, or personnel identities..."
                  className="w-full bg-transparent p-6 pl-16 text-xl font-bold text-slate-900 placeholder:text-slate-300 outline-none"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <div className="absolute right-6 top-6 flex items-center gap-2">
                   <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-500 uppercase">ESC TO CLOSE</kbd>
                </div>
              </div>

              {searchQuery && (
                <div className="border-t border-slate-100 max-h-[400px] overflow-y-auto bg-slate-50/50">
                  {results.length > 0 ? (
                    <div className="p-4 space-y-4">
                      {results.map((item: any, idx) => (
                        <Link 
                          key={idx}
                          to={item.type === 'PRODUCT' ? '/products' : '/warehouses'}
                          onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:border-primary-500 hover:shadow-premium transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                              item.type === 'PRODUCT' ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"
                            )}>
                              {item.type === 'PRODUCT' ? <Box className="w-5 h-5"/> : <Warehouse className="w-5 h-5"/>}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 tracking-tight leading-none">{item.name}</p>
                              <div className="flex items-center gap-2 mt-1.5 font-bold uppercase tracking-widest text-[9px]">
                                <span className={item.type === 'PRODUCT' ? "text-amber-600" : "text-indigo-600"}>{item.type}</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-500">{item.sku || item.location || 'ACTIVE NODE'}</span>
                              </div>
                            </div>
                          </div>
                          <ArrowLeftRight className="w-4 h-4 text-slate-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 text-slate-400">
                        <Search className="w-8 h-8" />
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight mb-2">Zero Null Vector</h4>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest max-w-[280px] leading-relaxed">The system could not locate any nodes matching your specific query parameters.</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-6">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Neural Search Active
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Encrypted Indexing
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const Layout: React.FC<{ children: React.ReactNode; user: any; onLogout: () => void }> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Find current page title
  const currentNavItem = navItems.find(item => location.pathname.startsWith(item.path));
  const pageTitle = location.pathname === '/profile' ? 'Profile' : currentNavItem?.label || 'Smart Inventory';

  return (
    <div className="flex h-screen bg-background overflow-hidden text-text-primary font-sans">
      <Sidebar user={user} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} onMenuClick={() => setIsSidebarOpen(true)} pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; user: any; onLogout: () => void }> = ({ children, user, onLogout }) => {
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Layout user={user} onLogout={onLogout}>{children}</Layout>;
};

const AuthWrapper = () => {
  const [user, setUser] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem('current_user');
    if (raw) {
      setUser(JSON.parse(raw));
    }
    setIsInitializing(false);
  }, []);

  const handleLogin = (u: any, token: string) => {
    localStorage.setItem('current_user', JSON.stringify(u));
    localStorage.setItem('token', token);
    setUser(u);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('current_user');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  if (isInitializing) return <div className="min-h-screen bg-background" />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={<ProtectedRoute user={user} onLogout={handleLogout}><DashboardPage /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute user={user} onLogout={handleLogout}><ProductsPage userRole={user?.role} /></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute user={user} onLogout={handleLogout}><CategoriesPage userRole={user?.role} /></ProtectedRoute>} />
      <Route path="/brands" element={<ProtectedRoute user={user} onLogout={handleLogout}><BrandsPage userRole={user?.role} /></ProtectedRoute>} />
      <Route path="/suppliers" element={<ProtectedRoute user={user} onLogout={handleLogout}><SuppliersPage userRole={user?.role} /></ProtectedRoute>} />
      <Route path="/warehouses" element={<ProtectedRoute user={user} onLogout={handleLogout}><WarehousesPage userRole={user?.role} /></ProtectedRoute>} />
      <Route path="/stock-in" element={<ProtectedRoute user={user} onLogout={handleLogout}><StockInPage userId={user?.id} /></ProtectedRoute>} />
      <Route path="/stock-out" element={<ProtectedRoute user={user} onLogout={handleLogout}><StockOutPage userId={user?.id} /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute user={user} onLogout={handleLogout}><TransactionsPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute user={user} onLogout={handleLogout}><ReportsPage userRole={user?.role} /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute user={user} onLogout={handleLogout}><UsersPage /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute user={user} onLogout={handleLogout}><AuditLogsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute user={user} onLogout={handleLogout}><ProfilePage /></ProtectedRoute>} />
      
      <Route path="*" element={<ProtectedRoute user={user} onLogout={handleLogout}><NotFoundPage /></ProtectedRoute>} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <UIProvider>
      <InventoryProvider>
        <AuthWrapper />
      </InventoryProvider>
    </UIProvider>
  );
};

export default App;