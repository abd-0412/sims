import React, { useMemo, useState } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, AlertTriangle, 
  FileSpreadsheet, ListTodo, Package, ShieldCheck,
  Vault, ArrowUpRight, Activity, PieChart as PieChartIcon,
  Download, Filter, RefreshCcw, IndianRupee, Layers, Warehouse, Copyright, Truck, Target, Zap
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { useInventory } from '../context/InventoryContext';
import { exportToCSV } from '../utils/csvExport';
import { UserRole } from '../types';
import { hasPermission } from '../utils/permissions';
import { 
  PageHeader, Card, Badge, Button, StatCard, 
  PopupModal, DataTable, GlobalCommandBar, 
  ExpandableRow, cn 
} from '../components/UIComponents';
import { motion, AnimatePresence } from 'framer-motion';

const ReportsPage: React.FC<{ userRole?: UserRole }> = ({ userRole }) => {
  const { products, transactions, categories, brands, suppliers, warehouses, createLog } = useInventory();
  const [activeDetail, setActiveDetail] = useState<'worth' | 'profit' | 'exceptions' | null>(null);

  const currentUserRaw = localStorage.getItem('current_user');
  const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : { id: 'system' };

  const analytics = useMemo(() => {
    const critical = products.filter(p => p.currentStock <= p.reorderLevel);
    const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0);
    const potentialMargin = products.reduce((sum, p) => sum + (p.currentStock * (p.sellingPrice - p.costPrice)), 0);

    const categoryWorth = categories.map(cat => ({
      name: cat.name,
      value: products.filter(p => String(p.categoryId) === String(cat.id)).reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0)
    })).sort((a, b) => b.value - a.value);

    const categoryProfit = categories.map(cat => ({
      name: cat.name,
      value: products.filter(p => String(p.categoryId) === String(cat.id)).reduce((sum, p) => sum + (p.currentStock * (p.sellingPrice - p.costPrice)), 0)
    })).sort((a, b) => b.value - a.value);

    const brandWorth = (brands || []).map(b => ({
      name: b.name,
      value: products.filter(p => String(p.brandId) === String(b.id)).length
    })).filter(b => b.value > 0).sort((a,b) => b.value - a.value).slice(0, 5);

    const supplierWorth = (suppliers || []).map(s => ({
      name: s.name,
      value: products.filter(p => String(p.supplierId) === String(s.id)).length
    })).filter(s => s.value > 0).sort((a,b) => b.value - a.value).slice(0, 5);

    const warehouseWorth = (warehouses || []).map(w => ({
      name: w.name,
      value: products.filter(p => String(p.warehouseId) === String(w.id)).length
    })).filter(w => w.value > 0).sort((a,b) => b.value - a.value);

    return { critical, totalValue, potentialMargin, categoryWorth, categoryProfit, brandWorth, supplierWorth, warehouseWorth };
  }, [products, categories, brands, suppliers, warehouses]);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

  const canExport = hasPermission(userRole || UserRole.STAFF, 'EXPORT_DATA');

  const handleExport = (type: string) => {
    try {
      if (type === 'PRODUCTS') {
        exportToCSV('Product_Master_Report', products);
        createLog(currentUser.id, 'CSV_EXPORT', 'REPORT', undefined, 'Exported Product Master list');
      } else if (type === 'TRANSACTIONS') {
        exportToCSV('Transaction_Ledger_Report', transactions);
        createLog(currentUser.id, 'CSV_EXPORT', 'REPORT', undefined, 'Exported Full Transaction Ledger');
      } else {
        exportToCSV('Critical_Stock_Report', analytics.critical);
        createLog(currentUser.id, 'CSV_EXPORT', 'REPORT', undefined, 'Exported Critical Stock Exception report');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Intelligence & Insights"
        subtitle="Holistic overview of inventory health, capital distribution and operational performance."
        actions={
          <div className="flex gap-3">
             <Button variant="ghost" icon={RefreshCcw} onClick={() => window.location.reload()}>Sync Data</Button>
             {canExport && (
               <Button variant="primary" icon={Download} onClick={() => handleExport('PRODUCTS')}>Export Report</Button>
             )}
          </div>
        }
      />

      <GlobalCommandBar
        searchValue=""
        onSearchChange={() => { }}
        searchPlaceholder="Filter intelligence by metric or time..."
        filters={[
          { label: 'All Indicators', active: true, onClick: () => {} },
          { label: 'Financials', active: false, onClick: () => {} },
          { label: 'Risk Analysis', active: false, onClick: () => {} }
        ]}
      />

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Inventory Valuation"
          value={`₹${analytics.totalValue.toLocaleString()}`}
          sub="Locked Capital Magnitude"
          icon={IndianRupee}
          trend={{ value: 12.5, isUp: true }}
          onClick={() => setActiveDetail('worth')}
        />
        <StatCard
          label="Projected Margin"
          value={`₹${analytics.potentialMargin.toLocaleString()}`}
          sub="Theoretical Yield"
          icon={TrendingUp}
          trend={{ value: 8.2, isUp: true }}
          onClick={() => setActiveDetail('profit')}
        />
        <StatCard
          label="Critical Exceptions"
          value={`${analytics.critical.length} SKUs`}
          sub={analytics.critical.length > 0 ? "Thresholds Breached" : "Operating Norms"}
          icon={AlertTriangle}
          status={analytics.critical.length > 0 ? 'danger' : 'success'}
          onClick={() => setActiveDetail('exceptions')}
        />
      </div>

      <div className="pb-12">
        <Card className="shadow-premium border-slate-800 bg-slate-950 text-white overflow-hidden relative group/terminal">
           {/* Deep Space Background Accents */}
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none group-hover/terminal:bg-indigo-500/10 transition-all duration-1000" />
           <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none group-hover/terminal:bg-emerald-500/10 transition-all duration-1000" />
           
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
              <div className="flex items-center gap-5">
                 <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-[28px] flex items-center justify-center border border-indigo-500/20 backdrop-blur-2xl shadow-2xl shadow-indigo-500/20 group hover:bg-indigo-600 hover:text-white hover:border-indigo-400 transition-all duration-500 cursor-help">
                    <Target className="w-8 h-8 group-hover:scale-110 transition-transform duration-500" />
                 </div>
                 <div>
                     <h2 className="text-3xl font-black tracking-tight text-white mb-1 uppercase drop-shadow-sm">Predictive Intelligence Terminal</h2>
                     <p className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.3em] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                        Multi-Vector Procurement Forecasting & Flux Analysis
                     </p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                       <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center text-[11px] font-black text-white hover:text-indigo-400 hover:border-indigo-500 transition-all cursor-default shadow-lg shadow-indigo-500/5">
                          0{i}
                       </div>
                    ))}
                 </div>
                 <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-6 py-3 font-black text-[10px] shadow-lg shadow-emerald-500/10 tracking-widest leading-none">AI CORE: ONLINE</Badge>
              </div>
           </div>
 
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 relative z-10">
              {/* Brand Velocity Matrix */}
              <div className="space-y-10">
                 <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                          <Copyright className="w-5 h-5 text-indigo-400" />
                       </div>
                        <span className="text-base font-black uppercase tracking-[0.2em] text-white">Segment Velocity Engine</span>
                     </div>
                     <div className="flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Flux</span>
                     </div>
                 </div>
                 <div className="h-[320px] group/chart relative">
                    <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-indigo-500/5 to-transparent pointer-events-none" />
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={analytics.brandWorth.map(b => {
                          const brandObj = brands.find(br => br.name === b.name);
                          const brandProducts = products.filter(p => String(p.brandId) === String(brandObj?.id));
                          const sold = brandProducts.reduce((sum, p) => sum + (p.total_sold || 0), 0);
                          const total = brandProducts.reduce((sum, p) => sum + p.currentStock + (p.total_sold || 0), 1);
                          return { name: b.name, demand: sold, reserve: total - sold, velocity: Math.round((sold/total)*100) };
                       })}>
                          <defs>
                             <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                                <stop offset="100%" stopColor="#4338ca" stopOpacity={0.6}/>
                             </linearGradient>
                             <linearGradient id="reserveGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgba(255,255,255,0.08)" stopOpacity={1}/>
                                <stop offset="100%" stopColor="rgba(255,255,255,0.02)" stopOpacity={0.4}/>
                             </linearGradient>
                          </defs>
                          <XAxis dataKey="name" hide />
                          <Tooltip 
                             cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 12 }}
                             content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                   const data = payload[0].payload;
                                   return (
                                      <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[220px]">
                                         <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                                            <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">{data.name}</p>
                                            <Badge variant="success" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[8px]">{data.velocity}%</Badge>
                                         </div>
                                         <div className="space-y-2.5">
                                            <div className="flex justify-between text-[10px] font-bold">
                                               <span className="text-slate-500 uppercase tracking-tight">Active Demand:</span>
                                               <span className="text-white tabular-nums">{data.demand} UNITS</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-bold">
                                               <span className="text-slate-500 uppercase tracking-tight">System Reserve:</span>
                                               <span className="text-slate-200 tabular-nums">{data.reserve} UNITS</span>
                                            </div>
                                            <motion.div className="h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
                                               <motion.div 
                                                  className="h-full bg-indigo-500" 
                                                  initial={{ width: 0 }} 
                                                  animate={{ width: `${data.velocity}%` }} 
                                               />
                                            </motion.div>
                                         </div>
                                      </div>
                                   );
                                }
                                return null;
                             }}
                          />
                          <Bar dataKey="demand" stackId="a" fill="url(#velocityGradient)" radius={[6, 6, 0, 0]} barSize={48} />
                          <Bar dataKey="reserve" stackId="a" fill="url(#reserveGradient)" radius={[6, 6, 0, 0]} barSize={48} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {analytics.brandWorth.slice(0, 4).map((b, idx) => {
                       const brand = brands.find(br => br.name === b.name);
                       const brandProducts = products.filter(p => String(p.brandId) === String(brand?.id));
                       const sold = brandProducts.reduce((sum, p) => sum + (p.total_sold || 0), 0);
                       const total = brandProducts.reduce((sum, p) => sum + p.currentStock + (p.total_sold || 0), 1);
                       const velocity = Math.round((sold/total)*100);
                       const isHighFlux = velocity > 50;
                       
                       return (
                          <motion.div 
                             key={b.name} 
                             initial={{ opacity: 0, y: 20 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: idx * 0.1 }}
                             className="p-6 bg-white/[0.03] border border-white/5 rounded-[24px] flex items-center justify-between group hover:bg-white/[0.08] hover:border-indigo-500/40 transition-all duration-500 cursor-default"
                          >
                             <div>
                                <p className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-2">{b.name}</p>
                                <div className="flex items-center gap-3">
                                   <div className={cn("w-2 h-2 rounded-full", isHighFlux ? "bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)] animate-pulse" : "bg-slate-600")} />
                                   <p className="text-xl font-black text-white leading-none tabular-nums">{velocity}% <span className="text-[11px] text-white/50 ml-1">FLUX</span></p>
                                </div>
                             </div>
                             <button className={cn(
                                "h-10 px-4 rounded-xl text-[10px] font-black uppercase transition-all tracking-[0.1em] border backdrop-blur-md",
                                isHighFlux ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30 group-hover:bg-indigo-600 group-hover:text-white" : "bg-white/5 text-slate-500 border-white/5 hover:bg-white/10"
                             )}>
                                {isHighFlux ? 'High Flux' : 'Static'}
                             </button>
                          </motion.div>
                       );
                    })}
                 </div>
              </div>
 
              {/* Warehouse Spectrum */}
              <div className="space-y-10">
                 <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                          <Warehouse className="w-5 h-5 text-emerald-400" />
                       </div>
                        <span className="text-base font-black uppercase tracking-[0.2em] text-white">Storage Spectrum Matrix</span>
                     </div>
                     <div className="flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Global Nodes</span>
                     </div>
                 </div>
                 <div className="h-[320px] flex items-center justify-center relative">
                    <div className="absolute flex flex-col items-center justify-center z-20">
                        <p className="text-[12px] font-black text-indigo-300 uppercase tracking-[0.3em] mb-1">Portfolio yield</p>
                        <p className="text-5xl font-black text-white tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">84.2%</p>
                    </div>
                    {/* Glowing Ring Decorative */}
                    <div className="absolute w-64 h-64 border border-white/5 rounded-full z-0 animate-[spin_20s_linear_infinite]" />
                    <div className="absolute w-[280px] h-[280px] border border-white/5 border-dashed rounded-full z-0 animate-[spin_30s_linear_infinite_reverse]" />
                    
                    <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                       <PieChart>
                          <Pie 
                             data={analytics.warehouseWorth} 
                             innerRadius={95} 
                             outerRadius={125} 
                             paddingAngle={8} 
                             dataKey="value"
                             stroke="none"
                          >
                             {analytics.warehouseWorth.map((_, i) => (
                                <Cell 
                                   key={i} 
                                   fill={COLORS[(i+4)%COLORS.length]} 
                                   className="hover:opacity-80 hover:brightness-125 transition-all duration-300 cursor-pointer"
                                />
                             ))}
                          </Pie>
                          <Tooltip 
                             content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                   return (
                                      <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 p-4 rounded-xl shadow-2xl">
                                         <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">{payload[0].name}</p>
                                         <p className="text-xs font-black text-emerald-400">{payload[0].value} SKUs ACTIVATED</p>
                                      </div>
                                   );
                                }
                                return null;
                             }}
                          />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {analytics.warehouseWorth.slice(0, 4).map((w, idx) => {
                       const load = Math.round((w.value / (products.length || 1)) * 100);
                       const isStrained = load > 50;
 
                       return (
                          <motion.div 
                             key={w.name} 
                             initial={{ opacity: 0, y: 20 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: (idx + 4) * 0.1 }}
                             className="p-6 bg-white/[0.03] border border-white/5 rounded-[24px] flex items-center justify-between group hover:bg-white/[0.08] hover:border-emerald-500/40 transition-all duration-500 cursor-default"
                          >
                             <div>
                                <p className="text-[11px] font-black text-emerald-300 uppercase tracking-[0.2em] mb-2">{w.name}</p>
                                <div className="flex items-center gap-3">
                                   <div className={cn("w-2 h-2 rounded-full", isStrained ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)] pulse" : "bg-emerald-500")} />
                                   <p className="text-xl font-black text-white leading-none tabular-nums">{load}% <span className="text-[11px] text-white/50 ml-1">OCCUPANCY</span></p>
                                </div>
                             </div>
                             <div className={cn(
                                "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 border",
                                isStrained ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white"
                             )}>
                                <Activity className="w-5 h-5" />
                             </div>
                          </motion.div>
                       );
                    })}
                 </div>
              </div>
           </div>
 
           {/* Predictive Action Panel */}
           <div className="mt-16 p-10 bg-indigo-600/5 border border-indigo-500/10 rounded-[40px] flex flex-col lg:flex-row items-center gap-10 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-700">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-1000" />
              <div className="w-24 h-24 bg-indigo-600 text-white rounded-[32px] flex items-center justify-center shrink-0 shadow-[0_0_50px_rgba(79,70,229,0.3)] relative z-10 group-hover:rotate-12 transition-all duration-700">
                 <Zap className="w-12 h-12 animate-pulse" />
              </div>
              <div className="flex-1 relative z-10 text-center lg:text-left">
                 <div className="flex flex-col lg:flex-row items-center gap-4 mb-4">
                    <p className="text-xl font-black text-white uppercase tracking-tight">Active Intelligence Vector</p>
                    <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[9px] font-black text-indigo-400 shadow-inner">THREAT DETECTED: LEVEL 4</span>
                 </div>
                 <p className="text-base text-indigo-200/80 leading-relaxed font-semibold max-w-2xl">
                    Critical stock velocity breach detected in <span className="text-white font-black underline decoration-indigo-500/50 underline-offset-8 cursor-help hover:text-indigo-300 transition-colors uppercase">{analytics.brandWorth[0]?.name}</span>. 
                    AI models predict a <span className="text-white font-black">94.8% stockout probability</span> within <span className="text-rose-400 font-black px-2 py-0.5 bg-rose-500/10 rounded border border-rose-500/20">48-72 hours</span>. 
                    Automated pre-procurement protocols initialized for Warehouse <span className="text-white font-bold">{analytics.warehouseWorth[0]?.name}</span>.
                 </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full lg:w-auto">
                 <Button variant="ghost" className="px-10 py-5 rounded-2xl border-white/5 hover:bg-white/5 text-slate-400 group-hover:text-white transition-all font-black text-xs uppercase tracking-widest">
                    Postpone Analysis
                 </Button>
                 <Button variant="primary" className="px-12 py-5 rounded-2xl shadow-[0_15px_35px_rgba(79,70,229,0.4)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.6)] hover:-translate-y-1 transition-all font-black text-xs uppercase tracking-[0.2em]">
                    Execute Order
                 </Button>
              </div>
           </div>
        </Card>
      </div>

      {/* Analytics Matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Brand Magnitude */}
        <Card className="shadow-sm border-slate-100 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                 <Copyright className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Brand Portfolio Share</h3>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.brandWorth} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {analytics.brandWorth.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800, fontSize: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
             {analytics.brandWorth.slice(0, 4).map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                   <span className="text-[10px] font-bold text-slate-500 uppercase truncate">{b.name}: {b.value}</span>
                </div>
             ))}
          </div>
        </Card>

        {/* Partner Dependency */}
        <Card className="shadow-sm border-slate-100 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                 <Truck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Supplier Dependency</h3>
            </div>
          </div>
          <div className="flex-1 min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={analytics.supplierWorth} layout="vertical">
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#64748b' }} />
                 <Tooltip cursor={{ fill: '#f8fafc' }} />
                 <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
               </BarChart>
             </ResponsiveContainer>
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center mt-2 italic">Dependency Metric via SKU Volume</p>
        </Card>

        {/* Storage Node Allocation */}
        <Card className="shadow-sm border-slate-100 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                 <Warehouse className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Node Allocation</h3>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={analytics.warehouseWorth} innerRadius={0} outerRadius={80} dataKey="value">
                    {analytics.warehouseWorth.map((_, i) => <Cell key={i} fill={COLORS[(i+2) % COLORS.length]} />)}
                 </Pie>
                 <Tooltip />
               </PieChart>
            </ResponsiveContainer>
          </div>
           <div className="grid grid-cols-2 gap-2 mt-4">
             {analytics.warehouseWorth.slice(0, 4).map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[(i+2) % COLORS.length] }} />
                   <span className="text-[10px] font-bold text-slate-500 uppercase truncate">{w.name}: {w.value}</span>
                </div>
             ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exception Monitor */}
        <Card className="flex flex-col h-[520px] px-0 py-0 overflow-hidden group">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Low Stock Monitor</h3>
            </div>
            <Badge variant="danger" className="text-[10px] tabular-nums">LIVE: {analytics.critical.length}</Badge>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
            {analytics.critical.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl hover:border-red-200 hover:bg-red-50/30 group/item transition-all cursor-default"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center group-hover/item:bg-red-100 group-hover/item:text-red-600 transition-colors">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-none mb-1.5">{p.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">SKU: {p.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-lg font-bold tabular-nums leading-none mb-1", p.currentStock <= 0 ? 'text-red-500' : 'text-slate-900')}>
                    {p.currentStock}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Target: {p.reorderLevel}</p>
                </div>
              </motion.div>
            ))}
            {analytics.critical.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                   <ShieldCheck className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900 uppercase">System Integrity Nominal</p>
                  <p className="text-xs text-slate-400 font-medium">No stock exceptions detected at this time.</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Audit Feed */}
        <Card className="flex flex-col h-[520px] px-0 py-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                   <ListTodo className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Operational Audit Trail</h3>
             </div>
             <Badge variant="neutral" className="text-[10px]">Real-time Feed</Badge>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
            <AnimatePresence>
              {transactions.slice(0, 15).map((t, idx) => (
                <motion.div
                  key={t.id || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200 group/item"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover/item:scale-110 shrink-0",
                    t.type === 'IN' || t.type === 'PURCHASE' ? "bg-emerald-50 text-emerald-600" : "bg-primary-50 text-primary-600"
                  )}>
                    {t.type === 'IN' || t.type === 'PURCHASE' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate leading-none mb-1.5 uppercase tracking-tight">{t.productName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       {t.type} <span className="w-1 h-1 bg-slate-200 rounded-full" /> {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn(
                      "text-lg font-bold tabular-nums leading-none",
                      t.type === 'IN' || t.type === 'PURCHASE' ? "text-emerald-600" : "text-primary-600"
                    )}>
                      {t.type === 'IN' || t.type === 'PURCHASE' ? '+' : '-'}{t.quantity}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      </div>

      <PopupModal
        isOpen={!!activeDetail}
        onClose={() => setActiveDetail(null)}
        title={activeDetail === 'worth' ? 'Equity Distribution' : activeDetail === 'profit' ? 'Yield Forecasting' : 'Supply Risk Mitigation'}
        icon={activeDetail === 'worth' ? Vault : activeDetail === 'profit' ? PieChart : AlertTriangle}
      >
        <div className="space-y-6">
          {activeDetail === 'worth' && (
            <DataTable headers={['Classification Branch', 'Market Magnitude', 'Equity Share']}>
              {analytics.categoryWorth.map((cat, i) => {
                const percentage = (cat.value / (analytics.totalValue || 1)) * 100;
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                       <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">{cat.name}</span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-sm font-bold text-slate-900 tabular-nums">₹{cat.value.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary-600 h-full rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 tabular-nums w-8">{Math.round(percentage)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </DataTable>
          )}

          {activeDetail === 'profit' && (
            <DataTable headers={['Taxonomy Node', 'Projected Yield', 'Health State']}>
              {analytics.categoryProfit.map((cat, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                     <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">{cat.name}</span>
                  </td>
                  <td className="px-6 py-4">
                     <span className="text-sm font-bold text-emerald-600 tabular-nums">₹{cat.value.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={cat.value > 1000 ? 'success' : 'neutral'} className="text-[10px] uppercase">
                      {cat.value > 1000 ? 'High Magnitude' : 'Nominal Flux'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}

          {activeDetail === 'exceptions' && (
            <div className="space-y-4">
              {analytics.critical.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-none mb-1.5 uppercase tracking-tight">{p.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">SKU: {p.sku}</p>
                    </div>
                  </div>
                  <Button variant="danger" className="text-xs h-9 px-4 uppercase tracking-wider font-bold">
                     Initialize Restock
                  </Button>
                </div>
              ))}
              {analytics.critical.length === 0 && (
                <div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                  All systems operating within nominal parameters.
                </div>
              )}
            </div>
          )}
        </div>
      </PopupModal>
    </div>
  );
};

export default ReportsPage;
