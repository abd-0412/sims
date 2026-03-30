import React, { useState } from 'react';
import { 
  Warehouse, MapPin, Package, Edit, Trash2, 
  Plus, Search, Database, Layers, ArrowUpRight,
  Activity, Info, Building2
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { 
  PageHeader, Card, Badge, Button, Input, 
  PopupModal, ConfirmModal, GlobalCommandBar, DataTable, cn 
} from '../components/UIComponents';
import { hasPermission } from '../utils/permissions';
import { UserRole } from '../types';

const WarehousesPage: React.FC<{ userRole?: UserRole }> = ({ userRole }) => {
  const { warehouses, warehouseStock, products, addWarehouse, updateWarehouse, deleteWarehouse } = useInventory();
  const user = JSON.parse(localStorage.getItem('current_user') || '{}');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({ name: '', location: '' });

  const filtered = warehouses.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.location && w.location.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpen = (warehouse?: any) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({ name: warehouse.name, location: warehouse.location || '' });
    } else {
      setEditingWarehouse(null);
      setFormData({ name: '', location: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.id, formData, user.id);
      } else {
        await addWarehouse(formData, user.id);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedWarehouse) {
      try {
        await deleteWarehouse(selectedWarehouse.id, user.id);
        setIsConfirmOpen(false);
        setSelectedWarehouse(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Infrastructure & Warehousing" 
        subtitle="Manage logical storage nodes, monitor distribution and optimize capacity across the network." 
        actions={
          hasPermission(userRole || UserRole.STAFF, 'MANAGE_WAREHOUSES', user.permissions) && (
            <Button variant="primary" icon={Plus} onClick={() => handleOpen()}>
              Add Warehouse
            </Button>
          )
        }
      />

      <GlobalCommandBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search warehouse locations or identifiers..."
        filters={[
          { label: 'All Clusters', active: true, onClick: () => {} },
          { label: `Active: ${warehouses.length}`, active: false, onClick: () => {} }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(w => {
          const stockEntries = warehouseStock.filter(s => String(s.warehouseId) === String(w.id));
          const totalUnits = stockEntries.reduce((sum, s) => sum + s.quantity, 0);
          const uniqueProducts = stockEntries.length;

          return (
            <Card key={w.id} className="group hover:shadow-premium transition-all duration-300 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-300 shadow-sm border border-slate-200/50">
                  <Warehouse className="w-6 h-6" />
                </div>
                <Badge variant={w.isActive ? "success" : "neutral"} className="text-[10px] uppercase tracking-wider">
                  {w.isActive ? 'Operating' : 'Full / Maintenance'}
                </Badge>
              </div>

              <div className="flex-1 space-y-2 mb-6">
                <h3 className="text-xl font-bold text-slate-900 leading-tight">{w.name}</h3>
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-medium truncate">{w.location || 'Co-located Site'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">Inventory</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900 tabular-nums">{uniqueProducts}</span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">SKUs</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">Volume</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900 tabular-nums">{totalUnits}</span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Units</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">
                  <Activity className="w-3.5 h-3.5" />
                   Available
                </div>
                <div className="flex gap-2">
                  {hasPermission(userRole || UserRole.STAFF, 'MANAGE_WAREHOUSES', user.permissions) && (
                    <button 
                      onClick={() => handleOpen(w)} 
                      className="p-2 text-slate-400 hover:text-slate-950 hover:bg-slate-200 rounded-lg transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {hasPermission(userRole || UserRole.STAFF, 'MANAGE_WAREHOUSES', user.permissions) && (
                    <button 
                      onClick={() => { setSelectedWarehouse(w); setIsConfirmOpen(true); }} 
                      className="p-2 text-slate-400 hover:text-rose-950 hover:bg-rose-100 rounded-lg transition-all"
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

      {/* Infrastructure Ledger */}
      {warehouseStock.length > 0 && (
        <Card className="px-0 py-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Storage Node Distribution</h3>
          </div>
          <DataTable headers={['Target Product', 'Storage Facility', 'Available Magnitude', 'Health State']}>
            {warehouseStock.map((s, idx) => (
              <tr key={s.id || idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-900">{s.productName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                    <Building2 className="w-4 h-4 mt-0.5" />
                    {s.warehouseName}
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-slate-900 tabular-nums">
                  {s.quantity.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <Badge variant={s.quantity > 0 ? "success" : "danger"}>
                    {s.quantity > 0 ? "Nominal" : "Exhausted"}
                  </Badge>
                </td>
              </tr>
            ))}
          </DataTable>
        </Card>
      )}

      <PopupModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingWarehouse ? 'Modify Storage Node' : 'Initialize New Warehouse'}
        icon={Warehouse}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Infrastructure Alias" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            placeholder="e.g. Northeast Regional Hub" 
            icon={Building2}
            required 
          />
          <Input 
            label="Physical Geo-Location" 
            value={formData.location} 
            onChange={e => setFormData({...formData, location: e.target.value})} 
            placeholder="GPS Coordinates or Street Address" 
            icon={MapPin}
          />
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Discard
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {editingWarehouse ? 'Synchronize Data' : 'Save Infrastructure'}
            </Button>
          </div>
        </form>
      </PopupModal>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Archive Storage Node?"
        message={`This will deactivate '${selectedWarehouse?.name}'. All future logistics through this node will be suspended.`}
        confirmLabel="Confirm Archive"
      />
    </div>
  );
};

export default WarehousesPage;
