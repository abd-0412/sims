import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusCircle, Package, Hash, ClipboardList, FileEdit, 
  Coins, Fingerprint, Search, ShieldCheck, ArrowRight,
  TrendingUp, Activity, Barcode, CheckCircle2,
  Info, AlertCircle, LayoutDashboard, IndianRupee, Copyright
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useUI } from '../context/UIContext';
import { Card, Input, Button, Badge, PageHeader, cn } from '../components/UIComponents';

const StockInPage: React.FC<{ userId?: string }> = ({ userId }) => {
  const { products, warehouses, processStockMovement } = useInventory();
  const { showToast } = useUI();
  const [formData, setFormData] = useState({ 
    productId: '', 
    warehouseId: warehouses[0]?.id.toString() || '',
    quantity: '', 
    reason: 'Restocking', 
    remarks: '' 
  });
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedProduct = products.find(p => String(p.id) === String(formData.productId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !userId) return;

    setLoading(true);
    try {
      const ok = await processStockMovement('IN', formData.productId, Number(formData.quantity), formData.reason, formData.remarks, userId, formData.warehouseId);
      if (ok) {
        setIsSuccess(true);
        setTimeout(() => {
          showToast(`Successfully inducted ${formData.quantity} units of ${selectedProduct?.name}`, 'success');
          setFormData({ productId: '', warehouseId: warehouses[0]?.id.toString() || '', quantity: '', reason: 'Restocking', remarks: '' });
          setIsSuccess(false);
        }, 800);
      }
    } catch (err) {
      console.error(err);
      showToast('Internal system error during induction sequence.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Induction"
        subtitle="Secure portal for authorizing and recording physical asset transitions into the system manifold."
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Induction Module */}
        <div className="xl:col-span-7">
          <Card className={cn("transition-all duration-300", (loading || isSuccess) && "opacity-60 pointer-events-none")}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">State Authorization</h3>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Personnel validation required</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[10px] font-black leading-none">01</span>
                    Classification Identity
                  </label>
                  <div className="relative">
                    <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <select
                      required
                      value={formData.productId}
                      onChange={e => setFormData({ ...formData, productId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-[52px] pr-6 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold text-slate-700 appearance-none cursor-pointer"
                    >
                      <option value="">Select target SKU node...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          [{p.sku}] {p.brandName ? `(${p.brandName})` : ''} — {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[10px] font-black leading-none">02</span>
                    Target Warehouse / Storage Node
                  </label>
                  <div className="relative">
                    <LayoutDashboard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <select
                      required
                      value={formData.warehouseId}
                      onChange={e => setFormData({ ...formData, warehouseId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-[52px] pr-6 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold text-slate-700 appearance-none cursor-pointer"
                    >
                      {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} — {w.location}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[10px] font-black leading-none">03</span>
                      Magnitude
                    </label>
                    <Input
                      type="number"
                      required
                      min="1"
                      value={formData.quantity}
                      onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="Units to inject..."
                      icon={Hash}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[10px] font-black leading-none">04</span>
                      Logic Branch
                    </label>
                    <div className="relative">
                      <ClipboardList className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      <select
                        value={formData.reason}
                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-[52px] pr-6 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold text-slate-700 appearance-none cursor-pointer"
                      >
                        <option>Restocking</option>
                        <option>Customer Return</option>
                        <option>Operational Correction</option>
                        <option>Production Surplus</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[10px] font-black leading-none">05</span>
                    System Metadata
                  </label>
                  <div className="relative">
                    <FileEdit className="absolute left-4 top-4 w-5 h-5 text-slate-400 pointer-events-none" />
                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-[52px] pr-6 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold text-slate-700 placeholder:text-slate-400 min-h-[120px] resize-none"
                      value={formData.remarks}
                      onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="Specify batch series, shelf location, or supplemental verification data..."
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  variant="primary" 
                  loading={loading} 
                  disabled={!formData.productId || loading || isSuccess} 
                  className="w-full py-4 text-sm font-bold uppercase tracking-widest"
                >
                  {isSuccess ? 'Authority Committed' : 'Authorize State Change'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Projection Sidebar */}
        <div className="xl:col-span-5 space-y-6">
          <Card className="bg-slate-100 border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
               <Activity className="w-32 h-32 text-emerald-500" />
            </div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Delta Projection</h4>
              <Badge variant="success" className="bg-emerald-100 text-emerald-700 border-emerald-200 font-bold text-[10px]">REAL-TIME</Badge>
            </div>

            <AnimatePresence mode="wait">
              {selectedProduct ? (
                <motion.div
                  key={selectedProduct.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8 relative z-10"
                >
                  <div className="space-y-2">
                    <h3 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight uppercase line-clamp-2">{selectedProduct.name}</h3>
                    <div className="flex items-center gap-3">
                      <Badge variant="neutral" className="bg-slate-200 text-slate-900 border-slate-300 px-2 py-0.5 font-bold text-[10px]">{selectedProduct.sku}</Badge>
                      {selectedProduct.brandName && (
                        <Badge variant="primary" className="px-2 py-0.5 font-bold text-[10px] flex items-center gap-1">
                          <Copyright className="w-3 h-3" /> {selectedProduct.brandName}
                        </Badge>
                      )}
                      <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{selectedProduct.unit} Metric Entity</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white border border-slate-200 rounded-xl transition-all hover:bg-slate-50">
                      <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-2">Baseline</p>
                      <div className="flex items-baseline gap-1.5">
                        <p className="text-2xl font-bold text-slate-900 tabular-nums">{selectedProduct.currentStock}</p>
                        <span className="text-[10px] font-bold text-slate-600">{selectedProduct.unit}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl transition-all hover:bg-emerald-100/50">
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                         Target Node <TrendingUp className="w-3 h-3" />
                      </p>
                      <div className="flex items-baseline gap-1.5">
                        <p className="text-2xl font-bold text-emerald-600 tabular-nums">
                          {selectedProduct.currentStock + Number(formData.quantity || 0)}
                        </p>
                        <span className="text-[10px] font-bold text-emerald-700">{selectedProduct.unit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between hover:shadow-sm transition-all cursor-default">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <IndianRupee className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1 leading-none">Capital Induction</p>
                        <p className="text-xl font-bold text-emerald-600 tracking-tight tabular-nums leading-none">
                          +₹{(Number(formData.quantity || 0) * selectedProduct.costPrice).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </div>
                </motion.div>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center text-center relative z-10">
                  <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-2xl flex items-center justify-center mb-6">
                    <Package className="w-8 h-8" />
                  </div>
                  <h5 className="text-lg font-bold text-slate-900 uppercase tracking-tight mb-2">Awaiting State Selection</h5>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-widest max-w-[240px] leading-relaxed">Select a target SKU identity to initialize the state projection manifest.</p>
                </div>
              )}
            </AnimatePresence>
          </Card>

          <Card className="bg-primary-50 border-primary-100/50 shadow-none flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
               <Fingerprint className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 pt-0.5">
              <p className="text-sm font-bold text-primary-900 leading-none flex items-center gap-2 uppercase tracking-wide">
                 System Integrity Audit
              </p>
              <p className="text-xs font-semibold text-primary-700/70 leading-relaxed">
                Every state transition is cryptographically logged to the distributed ledger for immutable data transparency.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StockInPage;
