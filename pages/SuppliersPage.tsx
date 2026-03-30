import React, { useState } from 'react';
import { 
  Truck, User as UserIcon, Mail, Phone, MapPin, 
  Star, Edit, Trash2, Plus, Search, Filter,
  Building2, ExternalLink, Globe, ShieldCheck
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { 
  PageHeader, Card, Badge, Button, Input, 
  PopupModal, ConfirmModal, GlobalCommandBar, DataTable, cn 
} from '../components/UIComponents';
import { hasPermission } from '../utils/permissions';
import { UserRole } from '../types';

const SuppliersPage: React.FC<{ userRole?: UserRole }> = ({ userRole }) => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useInventory();
  const user = JSON.parse(localStorage.getItem('current_user') || '{}');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({ 
    name: '', 
    contact: '', 
    email: '', 
    phone: '', 
    address: '', 
    rating: 0 
  });

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.contact.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpen = (supplier?: any) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({ 
        name: supplier.name, 
        contact: supplier.contact, 
        email: supplier.email, 
        phone: supplier.phone, 
        address: supplier.address, 
        rating: supplier.rating 
      });
    } else {
      setEditingSupplier(null);
      setFormData({ 
        name: '', 
        contact: '', 
        email: '', 
        phone: '', 
        address: '', 
        rating: 0 
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData, user.id);
      } else {
        await addSupplier(formData, user.id);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedSupplier) {
      try {
        await deleteSupplier(selectedSupplier.id, user.id);
        setIsConfirmOpen(false);
        setSelectedSupplier(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Supplier Network" 
        subtitle="Manage your procurement partners, track performance ratings and contact details."
        actions={
          hasPermission(userRole || UserRole.STAFF, 'MANAGE_SUPPLIERS', user.permissions) && (
            <Button variant="primary" icon={Plus} onClick={() => handleOpen()}>
              Add Supplier
            </Button>
          )
        }
      />

      <GlobalCommandBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by vendor name, contact or email..."
        filters={[
          { label: 'All Partners', active: true, onClick: () => {} },
          { label: `Active: ${suppliers.length}`, active: false, onClick: () => {} }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(s => (
          <Card key={s.id} className="group hover:shadow-premium transition-all duration-300 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-300 shadow-sm border border-slate-200/50">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{s.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star} 
                        className={cn(
                          "w-3 h-3 transition-colors",
                          star <= s.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"
                        )} 
                      />
                    ))}
                  </div>
                </div>
              </div>
              <Badge variant={s.rating >= 4 ? "success" : "neutral"} className="text-[10px] uppercase tracking-wider">
                {s.rating >= 4 ? "Preferred" : "Standard"}
              </Badge>
            </div>

            <div className="flex-1 space-y-3 mb-8">
              <div className="flex items-center gap-3 text-slate-500 hover:text-primary-600 transition-colors cursor-pointer">
                <UserIcon className="w-4 h-4" />
                <span className="text-sm font-semibold">{s.contact}</span>
              </div>
              {s.email && (
                <div className="flex items-center gap-3 text-slate-500">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium truncate">{s.email}</span>
                </div>
              )}
              {s.phone && (
                <div className="flex items-center gap-3 text-slate-500">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">{s.phone}</span>
                </div>
              )}
              {s.address && (
                <div className="flex items-start gap-3 text-slate-500">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="text-sm font-medium line-clamp-2">{s.address}</span>
                </div>
              )}
            </div>

            <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified
              </div>
              <div className="flex gap-2">
                {hasPermission(userRole || UserRole.STAFF, 'MANAGE_SUPPLIERS', user.permissions) && (
                  <button 
                    onClick={() => handleOpen(s)} 
                    className="p-2 text-slate-400 hover:text-slate-950 hover:bg-slate-200 rounded-lg transition-all"
                    title="Configure Partner"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                {hasPermission(userRole || UserRole.STAFF, 'MANAGE_SUPPLIERS', user.permissions) && (
                  <button 
                    onClick={() => { setSelectedSupplier(s); setIsConfirmOpen(true); }} 
                    className="p-2 text-slate-400 hover:text-rose-950 hover:bg-rose-100 rounded-lg transition-all"
                    title="Deactivate Partner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <PopupModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingSupplier ? 'Update Partner' : 'Onboard New Partner'}
        icon={Truck}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Vendor / Legal Name" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            placeholder="e.g. Global Logistics Inc." 
            icon={Building2}
            required 
          />
          <Input 
            label="Primary Contact Person" 
            value={formData.contact} 
            onChange={e => setFormData({...formData, contact: e.target.value})} 
            placeholder="e.g. Sarah Jenkins" 
            icon={UserIcon}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Business Email" 
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              placeholder="billing@vendor.com" 
              icon={Mail}
            />
            <Input 
              label="Contact Number" 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              placeholder="+1 (555) 000-0000" 
              icon={Phone}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 block text-slate-700">Operational Address</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-400 pointer-events-none" />
              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-[52px] pr-6 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold text-slate-700 placeholder:text-slate-400 min-h-[100px] resize-none"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                placeholder="Full operational headquarters address..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-3">Partner Reliability Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  type="button" 
                  onClick={() => setFormData({...formData, rating: star})}
                  className={cn(
                    "w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center group",
                    star <= formData.rating 
                      ? "bg-amber-500 border-amber-500 text-white shadow-premium" 
                      : "bg-slate-100 border-slate-200 text-slate-500 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
                  )}
                >
                  <Star className={cn("w-5 h-5", star <= formData.rating ? "fill-current" : "group-hover:fill-amber-400")} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Discard
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {editingSupplier ? 'Save Changes' : 'Onboard Partner'}
            </Button>
          </div>
        </form>
      </PopupModal>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Decommission Partner?"
        message={`Are you sure you want to deactivate ${selectedSupplier?.name}? This will restrict future procurement protocols with this entity.`}
        confirmLabel="Confirm Deactivation"
      />
    </div>
  );
};

export default SuppliersPage;
