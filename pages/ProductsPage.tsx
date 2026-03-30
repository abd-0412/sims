import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, Box, MoreVertical, Edit, Trash2, 
  ChevronDown, ChevronUp, AlertCircle, IndianRupee, Package,
  Layers, Tag, Info, ArrowUpRight, Activity, TrendingUp, Truck, ShieldCheck, Copyright
} from 'lucide-react';
import { Product, UserRole } from '../types';
import { useInventory } from '../context/InventoryContext';
import { hasPermission } from '../utils/permissions';
import { 
  PageHeader, Card, Badge, Button, Input, 
  PopupModal, ConfirmModal, DataTable, 
  GlobalCommandBar, ExpandableRow, cn 
} from '../components/UIComponents';

const ProductsPage: React.FC<{ userRole?: UserRole }> = ({ userRole }) => {
  const { products, categories, brands, suppliers, warehouses, addProduct, updateProduct, deleteProduct } = useInventory();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isPopupModalOpen, setIsPopupModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    sku: '', 
    name: '', 
    categoryId: '', 
    brandId: '',
    supplierId: '',
    warehouseId: '',
    unit: 'Pcs', 
    reorderLevel: '10', 
    costPrice: '0', 
    sellingPrice: '0'
  });

  const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');

  useEffect(() => {
    if (location.state && (location.state as any).filter === 'low') {
      setFilterStatus('low');
    }
  }, [location.state]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || String(p.categoryId) === String(filterCategory);
      const isLowStock = p.currentStock <= p.reorderLevel;
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'low' && isLowStock) ||
        (filterStatus === 'healthy' && !isLowStock);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, filterCategory, filterStatus]);

  const handleOpenPopupModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        sku: product.sku,
        name: product.name,
        categoryId: String(product.categoryId),
        brandId: String(product.brandId || ''),
        supplierId: String(product.supplierId || ''),
        warehouseId: '', // Usually not edited here as it affects multi-warehouse stock
        unit: product.unit,
        reorderLevel: String(product.reorderLevel),
        costPrice: String(product.costPrice),
        sellingPrice: String(product.sellingPrice)
      });
    } else {
      setEditingProduct(null);
      setFormData({
        sku: `SKU-${Math.floor(Math.random() * 100000)}`,
        name: '',
        categoryId: categories[0]?.id.toString() || '',
        brandId: brands[0]?.id.toString() || '',
        supplierId: suppliers[0]?.id.toString() || '',
        warehouseId: warehouses[0]?.id.toString() || '',
        unit: 'Pcs',
        reorderLevel: '10',
        costPrice: '0',
        sellingPrice: '0'
      });
    }
    setIsPopupModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      reorderLevel: Number(formData.reorderLevel),
      costPrice: Number(formData.costPrice),
      sellingPrice: Number(formData.sellingPrice),
      categoryId: formData.categoryId,
      brandId: formData.brandId || undefined,
      supplierId: formData.supplierId || undefined,
      warehouseId: formData.warehouseId || undefined
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload as any, currentUser.id);
      } else {
        await addProduct(payload as any, currentUser.id);
      }
      setIsPopupModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (productToDelete) {
      try {
        await deleteProduct(productToDelete.id, currentUser.id);
        setProductToDelete(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Catalog"
        subtitle="Manage your products, track stock levels and monitor performance."
        actions={
          hasPermission(userRole || UserRole.STAFF, 'CREATE_PRODUCT') && (
            <Button variant="primary" icon={Plus} onClick={() => handleOpenPopupModal()}>
              Add Product
            </Button>
          )
        }
      />

      <GlobalCommandBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search products or SKU..."
        filters={[
          { label: 'All Products', active: filterStatus === 'all', onClick: () => setFilterStatus('all') },
          { label: 'Healthy', active: filterStatus === 'healthy', onClick: () => setFilterStatus('healthy') },
          { label: 'Low Stock', active: filterStatus === 'low', onClick: () => setFilterStatus('low') },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-2">
        <div className="md:col-span-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block px-1">Category Filter</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm font-semibold text-slate-700 transition-all cursor-pointer shadow-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <Card className="px-0 py-0 overflow-hidden shadow-premium">
        <DataTable headers={['Product Identity', 'Brand & Category', 'Supply Source', 'Stock Status', 'Pricing', 'Health', 'Actions']}>
          {filteredProducts.map((p) => {
            const isLowStock = p.currentStock <= p.reorderLevel;
            const isExpanded = expandedRows[p.id];

            const MainRow = (
              <>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                      <Box className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-none">{p.name}</p>
                      <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">{p.sku}</p>
                    </div>
                  </div>
                </td>
                 <td className="px-6 py-4">
                  <div className="flex flex-col gap-1.5">
                    <Badge variant="primary" className="w-fit text-[9px] px-1.5 py-0.5 font-black uppercase flex items-center gap-1">
                      <Copyright className="w-2.5 h-2.5" /> {p.brandName || 'O.E.M'}
                    </Badge>
                    <Badge variant="neutral" className="w-fit text-[9px] px-1.5 py-0.5 font-bold uppercase">{p.categoryName || 'General'}</Badge>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors cursor-default">
                    <Truck className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] font-bold uppercase truncate max-w-[100px]">{p.supplierName || 'System'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3 min-w-[120px]">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", isLowStock ? 'bg-red-500' : 'bg-emerald-500')}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((p.currentStock / (p.reorderLevel * 2 || 100)) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-right">
                      <span className={cn("text-sm font-bold", isLowStock ? 'text-red-600' : 'text-slate-900')}>
                        {p.currentStock}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 ml-1">{p.unit}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-slate-900">₹{p.sellingPrice.toLocaleString()}</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">Sale Price</p>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={isLowStock ? 'danger' : 'success'}>
                    {isLowStock ? 'Low Stock' : 'Optimal'}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {hasPermission(userRole || UserRole.STAFF, 'EDIT_PRODUCT') && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenPopupModal(p); }} 
                        className="p-1.5 text-slate-400 hover:text-slate-950 hover:bg-slate-200 rounded-lg transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {hasPermission(userRole || UserRole.STAFF, 'DELETE_PRODUCT') && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setProductToDelete(p); }} 
                        className="p-1.5 text-slate-400 hover:text-rose-950 hover:bg-rose-100 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </>
            );

            const ExpandedData = (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-2">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-3 text-slate-500">
                    <IndianRupee className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Financials</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Cost Price:</span>
                      <span className="font-bold text-slate-900">₹{p.costPrice}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Margin:</span>
                      <span className="font-bold text-emerald-600">₹{(p.sellingPrice - p.costPrice).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-3 text-slate-500">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Inventory Rules</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Reorder At:</span>
                      <span className="font-bold text-amber-600">{p.reorderLevel} {p.unit}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Turnover:</span>
                      <span className="font-bold text-slate-900">{p.stock_turnover || '0.0'}x</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-3 text-slate-500">
                    <Info className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Activity</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Total Sold:</span>
                      <span className="font-bold text-slate-900">{p.total_sold || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Last Sale:</span>
                      <span className="font-bold text-slate-900">{p.last_sold_at ? new Date(p.last_sold_at).toLocaleDateString() : 'Never'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <Button variant="outline" size="sm" icon={ArrowUpRight} fullWidth>
                    View History
                  </Button>
                </div>
              </div>
            );

            return (
              <ExpandableRow
                key={p.id}
                mainContent={MainRow}
                expandedContent={ExpandedData}
                isExpanded={isExpanded}
                onToggle={() => toggleRow(p.id)}
              />
            );
          })}
        </DataTable>
      </Card>

      <PopupModal
        isOpen={isPopupModalOpen}
        onClose={() => setIsPopupModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add New Product"}
        icon={Box}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Product Name" 
              required 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              icon={Tag} 
              placeholder="e.g. Premium Coffee Beans" 
            />
            <Input 
              label="SKU / Label" 
              required 
              value={formData.sku} 
              onChange={e => setFormData({ ...formData, sku: e.target.value })} 
              icon={Info} 
              placeholder="e.g. COFFEE-001" 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Classification</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold text-slate-700 text-sm"
                value={formData.categoryId}
                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <option value="" disabled>Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lineage/Brand</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold text-slate-700 text-sm"
                value={formData.brandId}
                onChange={e => setFormData({ ...formData, brandId: e.target.value })}
              >
                <option value="">No Brand</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Primary Source</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold text-slate-700 text-sm"
                value={formData.supplierId}
                onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
              >
                <option value="">No Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {!editingProduct && (
            <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
               <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">
                 <ShieldCheck className="w-3.5 h-3.5" />
                 Verified
               </div>
               <label className="text-xs font-black text-primary-600 uppercase tracking-widest flex items-center gap-2">
                 <Truck className="w-3.5 h-3.5" /> Initial Induction Node
               </label>
               <select
                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 mt-2 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-bold text-slate-700 text-sm"
                value={formData.warehouseId}
                onChange={e => setFormData({ ...formData, warehouseId: e.target.value })}
              >
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.location})</option>)}
              </select>
              <p className="text-[10px] font-bold text-slate-500 mt-2 italic px-1">Note: New SKUs are initialized with zero reserves. This node defines the preferred induction port.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Reorder Level" 
              type="number" 
              value={formData.reorderLevel} 
              onChange={e => setFormData({ ...formData, reorderLevel: e.target.value })} 
              icon={AlertCircle} 
              placeholder="10" 
            />
            <Input 
              label="Measurement Unit" 
              value={formData.unit} 
              onChange={e => setFormData({ ...formData, unit: e.target.value })} 
              icon={Package} 
              placeholder="e.g. Bags, Kilograms" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <Input 
              label="Acquisition Cost (₹)" 
              type="number" 
              step="0.01" 
              value={formData.costPrice} 
              onChange={e => setFormData({ ...formData, costPrice: e.target.value })} 
              icon={IndianRupee} 
              placeholder="0.00" 
            />
            <Input 
              label="Selling Price (₹)" 
              type="number" 
              step="0.01" 
              value={formData.sellingPrice} 
              onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })} 
              icon={TrendingUp} 
              placeholder="0.00" 
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsPopupModalOpen(false)}>
              Discard
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {editingProduct ? "Update Catalog" : "Add to Catalog"}
            </Button>
          </div>
        </form>
      </PopupModal>

      <ConfirmModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Product"
        message={`This will permanently remove ${productToDelete?.name} from the catalog. This action cannot be undone.`}
        confirmLabel="Confirm Delete"
      />
    </div>
  );
};

export default ProductsPage;