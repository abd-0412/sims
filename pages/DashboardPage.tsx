import React, { useMemo, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend
} from 'recharts';
import { 
  Box, TrendingUp, IndianRupee, AlertCircle, ShoppingBag, 
  ArrowRight, CheckCircle2, Package, Truck, Activity,
  BarChart3, PieChart as PieChartIcon, Users, Repeat,
  ArrowUpRight, ArrowDownRight, Zap, Target, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useUI } from '../context/UIContext';
import { Card, Badge, StatCard, PageHeader, Button, cn } from '../components/UIComponents';

const DashboardPage: React.FC = () => {
  const { products = [], transactions = [], categories = [], suppliers = [], brands = [] } = useInventory();
  const navigate = useNavigate();
  const { showToast } = useUI();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    showToast('Initializing System-Wide Synchronization...', 'info');
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Global Node Synchronization Matrix: COMPLETE', 'success');
    }, 2000);
  };

  const metrics = useMemo(() => {
    const lowStockItems = products.filter(p => p.currentStock <= p.reorderLevel);
    
    const totalSales = transactions
      .filter(t => t.type === 'SALE' || t.type === 'OUT')
      .reduce((sum, t) => {
        const prod = products.find(p => String(p.id) === String(t.productId));
        return sum + (t.finalPrice || (t.quantity * (prod?.sellingPrice || 0)));
      }, 0);

    const inventoryValue = products.reduce((acc, p) => acc + (p.currentStock * (p.costPrice || 0)), 0);
    
    return {
      totalProducts: products.length,
      totalSales,
      inventoryValue,
      lowStock: lowStockItems.length,
      lowStockItems,
      activeSuppliers: suppliers.length
    };
  }, [products, transactions, suppliers]);

  const insights = useMemo(() => {
    const topProduct = [...products].sort((a, b) => (b.total_sold || 0) - (a.total_sold || 0))[0];
    const highReturn = [...products].sort((a, b) => (b.total_returned || 0) - (a.total_returned || 0))[0];
    const criticalStock = metrics.lowStockItems[0];
    const healthScore = products.length > 0 
      ? Math.round(((products.length - metrics.lowStock) / products.length) * 100)
      : 0;
    return { topProduct, highReturn, criticalStock, healthScore };
  }, [products, metrics.lowStock, metrics.lowStockItems]);

  const salesHistory = [
    { name: 'Jan', sales: 4200, profit: 1200 },
    { name: 'Feb', sales: 3800, profit: 950 },
    { name: 'Mar', sales: 5100, profit: 1540 },
    { name: 'Apr', sales: 4800, profit: 1300 },
    { name: 'May', sales: 6200, profit: 1800 },
    { name: 'Jun', sales: 7400, profit: 2100 },
  ];

  const stockFlow = [
    { name: 'Mon', in: 40, out: 24 },
    { name: 'Tue', in: 30, out: 13 },
    { name: 'Wed', in: 20, out: 98 },
    { name: 'Thu', in: 27, out: 39 },
    { name: 'Fri', in: 18, out: 48 },
    { name: 'Sat', in: 23, out: 38 },
    { name: 'Sun', in: 34, out: 43 },
  ];
  
  const riskTimeline = [
    { name: 'Wk 1', vulnerability: 12 },
    { name: 'Wk 2', vulnerability: 18 },
    { name: 'Wk 3', vulnerability: 14 },
    { name: 'Wk 4', vulnerability: 8 },
    { name: 'Wk 5', vulnerability: 15 },
    { name: 'Wk 6', vulnerability: metrics.lowStock },
  ];

  const supplierPerformance = suppliers.map((s, i) => ({
    name: s.name,
    volume: products.filter(p => String(p.supplierId) === String(s.id)).length
  })).sort((a, b) => b.volume - a.volume).slice(0, 5);

  const velocityData = brands.map(b => {
    const brandProducts = products.filter(p => String(p.brandId) === String(b.id));
    const sold = brandProducts.reduce((sum, p) => sum + (p.total_sold || 0), 0);
    const total = brandProducts.reduce((sum, p) => sum + p.currentStock + (p.total_sold || 0), 1);
    return { name: b.name, velocity: Math.round((sold / total) * 100) };
  }).sort((a, b) => b.velocity - a.velocity).slice(-5);

  const categoryDistribution = categories.map((cat, i) => ({
    name: cat.name,
    value: products.filter(p => String(p.categoryId) === String(cat.id)).length
  })).filter(c => c.value > 0).slice(0, 5);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Operational Intelligence" 
        subtitle="Manage your stock, reports, and real-time analytics with the Smart Inventory Management System (SIMS)."
        actions={
          <div className="flex items-center gap-3">
             <Button variant="outline" icon={Activity} className="hidden sm:inline-flex" onClick={() => navigate('/audit')}>Audit Logs</Button>
             <Button variant="primary" icon={Zap} onClick={handleSync} loading={isSyncing}>Initialize Sync</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Inventory Assets" 
          value={metrics.totalProducts.toLocaleString()} 
          icon={Box} 
          trend={{ value: 12, isUp: true }}
          className="border-slate-100 shadow-sm"
          onClick={() => navigate('/products')}
        />
        <StatCard 
          label="Periodic Revenue" 
          value={`₹${(metrics.totalSales / 1000).toFixed(1)}k`} 
          icon={TrendingUp} 
          trend={{ value: 18, isUp: true }}
          className="border-slate-100 shadow-sm"
          onClick={() => navigate('/reports')}
        />
        <StatCard 
          label="Valuation Reserve" 
          value={`₹${(metrics.inventoryValue / 1000).toFixed(1)}k`} 
          icon={IndianRupee} 
          trend={{ value: 3.2, isUp: false }}
          className="border-slate-100 shadow-sm"
          onClick={() => navigate('/reports')}
        />
        <StatCard 
          label="Stock Vulnerability" 
          value={metrics.lowStock} 
          icon={AlertCircle} 
          className={cn(
            "border-slate-100 shadow-sm transition-all",
            metrics.lowStock > 0 ? "border-amber-200 bg-amber-50/20" : ""
          )}
          onClick={() => navigate('/products', { state: { filter: 'low' } })}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 shadow-sm border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-none">Revenue Velocity</h3>
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mt-1">6-Month Capital Performance</p>
              </div>
            </div>
            <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold px-3 py-1">
              +24% GROWTH
            </Badge>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesHistory}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.05)', fontWeight: 600 }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sales" name="Volume" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="h-full shadow-sm border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
                   <Target className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-none">Smart Insights</h3>
              </div>
              <Badge variant="neutral" className="bg-slate-100 text-slate-500 border-slate-200 text-[10px] font-bold">AI ASSISTED</Badge>
            </div>
            
            <div className="space-y-5">
              <div className="flex items-start gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-premium">
                <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600 shadow-sm transition-all group-hover:bg-slate-900 group-hover:text-white group-hover:scale-110 border border-slate-200/50">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">High Velocity SKU</p>
                  <p className="text-sm font-bold text-slate-900 mt-1 uppercase line-clamp-1">{insights.topProduct?.name || 'No Data'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-slate-700">{insights.topProduct?.total_sold || 0} UNITS DISPATCHED</span>
                    <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  </div>
                </div>
              </div>

              <div className={cn(
                "flex items-start gap-4 p-4 rounded-2xl border transition-all",
                metrics.lowStock > 0 
                  ? "bg-amber-50/50 border-amber-100 hover:bg-amber-50 hover:border-amber-200" 
                  : "bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200"
              )}>
                <div className={cn(
                  "p-2.5 rounded-xl shadow-sm transition-all group-hover:bg-slate-900 group-hover:text-white group-hover:scale-110 border border-slate-200/50",
                  metrics.lowStock > 0 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                )}>
                  {metrics.lowStock > 0 ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                </div>
                <div>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    metrics.lowStock > 0 ? "text-amber-600" : "text-emerald-600"
                  )}>Resiliency Index</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {metrics.lowStock > 0 ? `${metrics.lowStock} Vulnerabilities Detected` : 'Operational Integrity: Optimal'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-700 mt-1 uppercase tracking-tight">System Health Score: {insights.healthScore}%</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-premium">
                <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600 shadow-sm transition-all group-hover:bg-slate-900 group-hover:text-white group-hover:scale-110 border border-slate-200/50">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Inventory Turnover</p>
                  <p className="text-sm font-bold text-slate-900 mt-1 uppercase">4.2x Annualized</p>
                  <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                     <ArrowUpRight className="w-3 h-3" /> BEATING INDUSTRY BENCHMARK
                  </p>
                </div>
              </div>
            </div>

            <Button variant="ghost" fullWidth className="mt-8 text-xs font-bold uppercase tracking-widest hover:text-primary-600">
              Operational Audit Report <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">
                <Activity className="w-3.5 h-3.5" />
                Available
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-none">Asset Flow Diagnostics</h3>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockFlow}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.05)', fontWeight: 600 }}
                />
                <Bar name="Inbound" dataKey="in" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar name="Outbound" dataKey="out" fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="shadow-sm border-slate-100">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center">
                <PieChartIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-none">Portfolio Mix</h3>
            </div>
            <Package className="w-5 h-5 text-slate-300" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center pt-2">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={10}
                    stroke="none"
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3.5 pr-4">
              {categoryDistribution.map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight group-hover:text-slate-900 transition-colors">{cat.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-black text-slate-900">{cat.value}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">SKUs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        <Card className="shadow-sm border-slate-100">
           <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-none">Stock Vulnerability Risk</h3>
            </div>
            <Badge variant="warning">+12% RISK PROFILE</Badge>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={riskTimeline}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                 <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.05)', fontWeight: 600 }}
                  />
                 <Line type="monotone" dataKey="vulnerability" name="Vulnerable SKUs" stroke="#f59e0b" strokeWidth={4} dot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="shadow-sm border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-none">Supplier Network Magnitude</h3>
            </div>
          </div>
          <div className="h-[280px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={supplierPerformance} layout="vertical" margin={{ left: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 10, fontWeight: 800, fill: '#475569' }} />
                 <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 600 }}
                  />
                 <Bar dataKey="volume" name="Inducted Active SKUs" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={20} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Predictive Velocity Terminal */}
      <div className="pb-12">
        <Card className="shadow-premium border-slate-100 bg-gradient-to-br from-white to-slate-50/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Market Velocity Index</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Predictive Asset Movement & Flux Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl shrink-0">
               <Badge variant="primary" className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase">Real-Time Engine</Badge>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={velocityData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} tickFormatter={(v) => `${v}%`} />
                 <Tooltip 
                    cursor={{ fill: 'rgba(99, 102, 241, 0.05)', radius: 8 }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                  />
                 <Bar dataKey="velocity" name="Movement Velocity %" radius={[10, 10, 0, 0]} barSize={40}>
                   {velocityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                 </Bar>
               </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-slate-100">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black text-xs">A+</div>
                <div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase">Top Performer</p>
                   <p className="text-sm font-black text-slate-900 uppercase">{(velocityData[velocityData.length-1]?.name || 'N/A')}</p>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs">{(velocityData[velocityData.length-1]?.velocity || 0)}%</div>
                <div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase">Max Velocity</p>
                   <p className="text-sm font-black text-slate-900 uppercase">High Flux Detected</p>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-black text-xs"><Repeat className="w-5 h-5"/></div>
                <div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase">Predictive Trend</p>
                   <p className="text-sm font-black text-slate-900 uppercase">Ascending Demand</p>
                </div>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;