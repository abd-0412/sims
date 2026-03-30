import React, { useState } from 'react';
import { 
  Copyright, Globe, Package, Edit, Trash2, 
  Plus, Search, Building2, ExternalLink, ShieldCheck
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { 
  PageHeader, Card, Badge, Button, Input, 
  PopupModal, ConfirmModal, GlobalCommandBar, cn 
} from '../components/UIComponents';
import { hasPermission } from '../utils/permissions';
import { UserRole } from '../types';

const BrandsPage: React.FC<{ userRole?: UserRole }> = ({ userRole }) => {
  const { brands, products, addBrand, updateBrand, deleteBrand } = useInventory();
  const user = JSON.parse(localStorage.getItem('current_user') || '{}');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({ name: '', website: '' });

  const filtered = brands.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.website && b.website.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpen = (brand?: any) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({ name: brand.name, website: brand.website || '' });
    } else {
      setEditingBrand(null);
      setFormData({ name: '', website: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBrand) {
        await updateBrand(editingBrand.id, formData, user.id);
      } else {
        await addBrand(formData, user.id);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedBrand) {
      try {
        await deleteBrand(selectedBrand.id, user.id);
        setIsConfirmOpen(false);
        setSelectedBrand(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Brand Registry" 
        subtitle="Maintain your manufacturer directory and track brand-specific product magnitudes." 
        actions={
          hasPermission(userRole || UserRole.STAFF, 'MANAGE_BRANDS', user.permissions) && (
            <Button variant="primary" icon={Plus} onClick={() => handleOpen()}>
              Add Brand
            </Button>
          )
        }
      />

      <GlobalCommandBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search brands or manufacturer websites..."
        filters={[
          { label: 'All Brands', active: true, onClick: () => {} },
          { label: `Direct Registry: ${brands.length}`, active: false, onClick: () => {} }
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map(b => {
          const productCount = products.filter(p => String(p.brandId) === String(b.id)).length;
          return (
            <Card key={b.id} className="group hover:shadow-premium transition-all duration-300 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center font-bold text-xl group-hover:bg-slate-900 group-hover:text-white transition-all duration-300 shadow-sm border border-slate-200/50">
                  {b.name.charAt(0).toUpperCase()}
                </div>
                <Badge variant={productCount > 0 ? "info" : "neutral"} className="text-[10px] tabular-nums tracking-wider uppercase">
                  {productCount} SKUs
                </Badge>
              </div>

              <div className="flex-1 space-y-1 mb-6">
                <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-primary-600 transition-colors uppercase tracking-tight">{b.name}</h3>
                {b.website && (
                  <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-500 transition-colors">
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs font-medium truncate">{b.website.replace(/^https?:\/\//, '')}</span>
                  </div>
                )}
              </div>

              <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </div>
                <div className="flex gap-2">
                  {hasPermission(userRole || UserRole.STAFF, 'MANAGE_BRANDS', user.permissions) && (
                    <button 
                      onClick={() => handleOpen(b)} 
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {hasPermission(userRole || UserRole.STAFF, 'MANAGE_BRANDS', user.permissions) && (
                    <button 
                      onClick={() => { setSelectedBrand(b); setIsConfirmOpen(true); }} 
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <PopupModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingBrand ? 'Modify Brand Node' : 'Initialize New Brand'}
        icon={Copyright}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Manufacturer / Brand Identity" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            placeholder="e.g. Acme Corporation" 
            icon={Building2}
            required 
          />
          <Input 
            label="Corporate Digital Interface (Website)" 
            value={formData.website} 
            onChange={e => setFormData({...formData, website: e.target.value})} 
            placeholder="https://acme-corp.com" 
            icon={Globe}
          />
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Discard
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {editingBrand ? 'Sync Identity' : 'Save Brand'}
            </Button>
          </div>
        </form>
      </PopupModal>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Deregister Brand?"
        message={`This will suspend the brand registry for '${selectedBrand?.name}'. Existing products linked to this identity will remain, but the registry node will be deactivated.`}
        confirmLabel="Confirm Deactivation"
      />
    </div>
  );
};

export default BrandsPage;
