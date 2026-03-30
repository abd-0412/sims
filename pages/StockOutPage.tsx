import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MinusCircle, Package, Hash, Truck, Map, 
  TrendingDown, ShieldAlert, Boxes, Barcode,
  AlertTriangle, CheckCircle2, ArrowRight,
  Activity, Info, LayoutDashboard, TruckIcon, IndianRupee, Copyright
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useUI } from '../context/UIContext';
import { Card, Input, Button, Badge, PageHeader, cn } from '../components/UIComponents';

const StockOutPage: React.FC<{ userId?: string }> = ({ userId }) => {
  const { products, warehouses, processStockMovement } = useInventory();
  const { showToast } = useUI();
  const [formData, setFormData] = useState({ 
    productId: '', 
    warehouseId: warehouses[0]?.id.toString() || '',
    quantity: '', 
    reason: 'Sales Dispatch', 
    remarks: '' 
  });
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedProduct = products.find(p => String(p.id) === String(formData.productId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !userId) return;

    const requestedQty = Number(formData.quantity);
    if (selectedProduct && selectedProduct.currentStock < requestedQty) {
      showToast(`Balance Insufficiency: Protocol blocked. Only ${selectedProduct.currentStock} units in reserve.`, 'error');
      return;
    }

    setLoading(true);
    try {
      const ok = await processStockMovement('OUT', formData.productId, requestedQty, formData.reason, formData.remarks, userId, formData.warehouseId);
      if (ok) {
        setIsSuccess(true);
        setTimeout(() => {
          showToast(`Successfully dispatched ${formData.quantity} units of ${selectedProduct?.name}`, 'success');
          setFormData({ productId: '', warehouseId: warehouses[0]?.id.toString() || '', quantity: '', reason: 'Sales Dispatch', remarks: '' });
          setIsSuccess(false);
        }, 800);
      }
    } catch (err) {
      console.error(err);
      showToast('Dispatch sequence failed due to terminal exception.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Dispatch"
        subtitle="Authorize product depletion, process outgoing shipments, and execute asset decrement protocols."
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Depletion Module */}
        <div className="xl:col-span-7">
          <Card className={cn("transition-all duration-300", (loading || isSuccess) && "opacity-60 pointer-events-none")}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center">
                <MinusCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">Depletion Sequence</h3>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Authorization mandatory</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-primary-600 text-white flex items-center justify-center text-[10px] font-black leading-none">01</span>
                    Dispatch Node Identification
                  </label>
                  <div className="relative">
                    <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <select
                      required
                      value={formData.productId}
                      onChange={e => setFormData({ ...formData, productId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-[52px] pr-6 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold text-slate-700 appearance-none cursor-pointer"
                    >
                      <option value="">Select dispatch SKU nominal...</option>
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
                    <span className="w-5 h-5 rounded bg-primary-600 text-white flex items-center justify-center text-[10px] font-black leading-none">02</span>
                    Extraction Node / Warehouse
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
                      <span className="w-5 h-5 rounded bg-primary-600 text-white flex items-center justify-center text-[10px] font-black leading-none">03</span>
                      Magnitude
                    </label>
                    <Input
                      type="number"
                      required
                      min="1"
                      value={formData.quantity}
                      onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="Units to deplete..."
                      icon={Hash}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-primary-600 text-white flex items-center justify-center text-[10px] font-black leading-none">04</span>
                      Logic Branch
                    </label>
                    <div className="relative">
                      <TruckIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      <select
                        value={formData.reason}
                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-[52px] pr-6 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold text-slate-700 appearance-none cursor-pointer"
                      >
                        <option>Sales Dispatch</option>
                        <option>Damaged / Loss</option>
                        <option>Internal Allocation</option>
                        <option>Expiration Purge</option>
                        <option>Returns Protocol</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-primary-600 text-white flex items-center justify-center text-[10px] font-black leading-none">05</span>
                    Logistics Metadata
                  </label>
                  <div className="relative">
                    <Map className="absolute left-4 top-4 w-5 h-5 text-slate-400 pointer-events-none" />
                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-[52px] pr-6 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold text-slate-700 placeholder:text-slate-400 min-h-[120px] resize-none"
                      value={formData.remarks}
                      onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="Specify customer identity, shipment sequence, or batch termination data..."
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  variant="danger" 
                  loading={loading} 
                  disabled={!formData.productId || loading || isSuccess} 
                  className="w-full py-4 text-sm font-bold uppercase tracking-widest"
                >
                  {isSuccess ? 'Dispatch Authorized' : 'Authorize Depletion'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Projection Sidebar */}
        <div className="xl:col-span-5 space-y-6">
          <Card className="bg-slate-100 border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
               <Boxes className="w-32 h-32 text-primary-500" />
            </div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Drawdown Simulation</h4>
              <Badge variant="neutral" className="bg-indigo-100 text-indigo-700 border-indigo-200 font-bold text-[10px]">PREDICTIVE</Badge>
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
                      <Badge variant="neutral" className="bg-slate-100 text-slate-900 border-slate-200 px-2 py-0.5 font-bold text-[10px]">{selectedProduct.sku}</Badge>
                      {selectedProduct.brandName && (
                        <Badge variant="primary" className="px-2 py-0.5 font-bold text-[10px] flex items-center gap-1">
                          <Copyright className="w-3 h-3" /> {selectedProduct.brandName}
                        </Badge>
                      )}
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{selectedProduct.unit} Metric Node</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl transition-all hover:bg-slate-100">
                      <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-2">Reserve Pool</p>
                      <div className="flex items-baseline gap-1.5">
                        <p className="text-2xl font-bold text-slate-900 tabular-nums">{selectedProduct.currentStock}</p>
                        <span className="text-[10px] font-bold text-slate-500">{selectedProduct.unit}</span>
                      </div>
                    </div>
                    <div className={cn(
                      "p-4 border rounded-xl transition-all",
                      selectedProduct.currentStock - Number(formData.quantity || 0) < 0 
                        ? "bg-red-500/10 border-red-500/20" 
                        : "bg-indigo-500/10 border-indigo-500/20"
                    )}>
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5",
                        selectedProduct.currentStock - Number(formData.quantity || 0) < 0 ? "text-red-600" : "text-indigo-600"
                      )}>
                         Post-Flux <TrendingDown className="w-3 h-3" />
                      </p>
                      <div className="flex items-baseline gap-1.5">
                        <p className={cn(
                          "text-2xl font-bold tabular-nums",
                          selectedProduct.currentStock - Number(formData.quantity || 0) < 0 ? "text-red-600" : "text-indigo-600"
                        )}>
                          {selectedProduct.currentStock - Number(formData.quantity || 0)}
                        </p>
                        <span className={cn(
                          "text-[10px] font-bold",
                          selectedProduct.currentStock - Number(formData.quantity || 0) < 0 ? "text-red-700" : "text-indigo-700"
                        )}>{selectedProduct.unit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between hover:shadow-sm transition-all cursor-default">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                        <IndianRupee className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1 leading-none">Capital Drawdown</p>
                        <p className="text-xl font-bold text-red-600 tracking-tight tabular-nums leading-none">
                          -₹{(Number(formData.quantity || 0) * selectedProduct.costPrice).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </div>
                </motion.div>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center text-center relative z-10">
                  <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-2xl flex items-center justify-center mb-6">
                    <TruckIcon className="w-8 h-8" />
                  </div>
                  <h5 className="text-lg font-bold text-slate-900 uppercase tracking-tight mb-2">Awaiting Dispatch Vector</h5>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-widest max-w-[240px] leading-relaxed">Select a target SKU identity to initialize the drawdown simulation manifest.</p>
                </div>
              )}
            </AnimatePresence>
          </Card>

          <Card className="bg-red-50 border-red-100/50 shadow-none flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
               <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 pt-0.5">
              <p className="text-sm font-bold text-red-900 leading-none flex items-center gap-2 uppercase tracking-wide">
                 Integrity Safeguard
              </p>
              <p className="text-xs font-semibold text-red-700/70 leading-relaxed">
                Negative balances are <strong className="font-bold">strictly prohibited</strong>. Dispatch requests exceeding available reserves will be blocked by system logic.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StockOutPage;
