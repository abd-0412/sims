import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, Plus, Search, Edit, Trash2, 
  List, MoreVertical, LayoutGrid, Package,
  ArrowRight, Info, PlusCircle, Tag
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Category } from '../types';
import { 
  Card, Badge, Button, Input, PageHeader, 
  PopupModal, ConfirmModal, GlobalCommandBar, cn 
} from '../components/UIComponents';

import { hasPermission } from '../utils/permissions';
import { UserRole } from '../types';

const CategoriesPage: React.FC<{ userRole?: UserRole }> = ({ userRole }) => {
  const { categories, addCategory, updateCategory, deleteCategory, products } = useInventory();
  const [isPopupModalOpen, setIsPopupModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setSelectedCategory(null);
    setFormData({ name: '', description: '' });
    setIsPopupModalOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setSelectedCategory(c);
    setFormData({ name: c.name, description: c.description || '' });
    setIsPopupModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedCategory) {
        await updateCategory(selectedCategory.id, formData, currentUser.id);
      } else {
        await addCategory(formData, currentUser.id);
      }
      setIsPopupModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedCategory) {
      try {
        await deleteCategory(selectedCategory.id, currentUser.id);
        setIsConfirmOpen(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Taxonomy & Categories"
        subtitle="Organize your product catalog into logical hierarchies and branches."
        actions={
          hasPermission(userRole || UserRole.STAFF, 'MANAGE_CATEGORIES', currentUser.permissions) && (
            <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
              Create Category
            </Button>
          )
        }
      />

      <GlobalCommandBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search category taxonomy..."
        filters={[
          { label: 'All Clusters', active: true, onClick: () => { } },
          { label: `Direct Count: ${categories.length}`, active: false, onClick: () => { } }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredCategories.map((cat, idx) => {
            const productCount = products.filter(p => String(p.categoryId) === String(cat.id)).length;
            
            return (
              <motion.div
                key={cat.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="h-full flex flex-col group hover:shadow-premium transition-all duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-300 shadow-sm border border-slate-200/50">
                      <Layers className="w-6 h-6" />
                    </div>
                    <Badge variant="neutral" className="bg-slate-100 text-slate-600 border-none font-bold uppercase tracking-wider text-[10px]">
                      Node ID: {cat.id?.slice(-4) || 'GEN'}
                    </Badge>
                  </div>

                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{cat.name}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                      {cat.description || "System default unclassified branch."}
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Stock Density</p>
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-lg font-bold text-slate-900 leading-none">{productCount}</span>
                        <span className="text-xs font-semibold text-slate-500 leading-none">SKUs</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                       {hasPermission(userRole || UserRole.STAFF, 'MANAGE_CATEGORIES', currentUser.permissions) && (
                         <button
                           onClick={() => handleOpenEdit(cat)}
                           className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all"
                           title="Edit Schema"
                         >
                           <Edit className="w-4 h-4" />
                         </button>
                       )}
                       {hasPermission(userRole || UserRole.STAFF, 'MANAGE_CATEGORIES', currentUser.permissions) && (
                         <button
                           onClick={() => { setSelectedCategory(cat); setIsConfirmOpen(true); }}
                           className={cn(
                             "p-2 text-slate-400 rounded-lg transition-all",
                             productCount > 0 ? "opacity-30 cursor-not-allowed" : "hover:text-red-600 hover:bg-red-100"
                           )}
                           disabled={productCount > 0}
                           title={productCount > 0 ? "Cannot delete category with active products" : "Purge Category"}
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {/* Quick Add Placeholder */}
        <motion.div 
          onClick={handleOpenAdd}
          className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-slate-400 hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50/30 cursor-pointer transition-all gap-3"
        >
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div className="text-center">
            <p className="font-bold text-sm">Add Branch</p>
            <p className="text-xs">Expand taxonomy grid</p>
          </div>
        </motion.div>
      </div>

      <PopupModal
        isOpen={isPopupModalOpen}
        onClose={() => setIsPopupModalOpen(false)}
        title={selectedCategory ? "Modify Taxonomy Node" : "Initialize New Branch"}
        icon={LayoutGrid}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Branch Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            icon={Tag}
            placeholder="e.g. Computing Hardware"
          />
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 block">System Description</label>
            <div className="relative">
              <List className="absolute left-4 top-4 w-5 h-5 text-slate-400 pointer-events-none" />
              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-[52px] pr-6 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold text-slate-700 placeholder:text-slate-400 min-h-[140px] resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="Briefly define this category taxonomy..."
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsPopupModalOpen(false)}>
              Discard
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {selectedCategory ? "Update Node" : "Save Branch"}
            </Button>
          </div>
        </form>
      </PopupModal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Sanitize Taxonomy Branch?"
        message={`Are you sure you want to remove the '${selectedCategory?.name}' branch? This will permanently sever this node from the system database.`}
        confirmLabel="Confirm Deletion"
      />
    </div>
  );
};

export default CategoriesPage;