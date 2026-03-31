import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, Search, UserCheck, Shield, Mail, 
  Key, UserCog, UserMinus, ShieldAlert,
  Fingerprint, Activity, Clock, ShieldCheck,
  MoreVertical, Edit2, Trash2, User
} from 'lucide-react';
import { User as UserType, UserRole } from '../types';
import { useInventory } from '../context/InventoryContext';
import { 
  PageHeader, GlobalCommandBar, Badge, Button, 
  Input, PopupModal, ConfirmModal, DataTable, cn 
} from '../components/UIComponents';

const UsersPage: React.FC = () => {
  const { users, addUser, updateUser, deleteUser } = useInventory();
  const [isPopupModalOpen, setIsPopupModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', role: UserRole.STAFF 
  });

  const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleOpenPopupModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenPopupModal = (user?: UserType) => {
    if (user) {
      setEditingUser(user);
      setFormData({ 
        name: user.name, 
        email: user.email, 
        password: user.password || '', 
        role: user.role 
      });
    } else {
      setEditingUser(null);
      setFormData({ 
        name: '', 
        email: '', 
        password: '', 
        role: UserRole.STAFF 
      });
    }
    setIsPopupModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        updateUser(editingUser.id, formData, currentUser.id);
      } else {
        addUser(formData, currentUser.id);
      }
      setIsPopupModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      try {
        deleteUser(userToDelete.id, currentUser.id);
        setUserToDelete(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: 
        return <Badge variant="premium" className="text-[10px] tracking-wider uppercase font-bold bg-indigo-50 text-indigo-600 border-indigo-100">Admin</Badge>;
      case UserRole.MANAGER: 
        return <Badge variant="info" className="text-[10px] tracking-wider uppercase font-bold">Manager</Badge>;
      default: 
        return <Badge variant="neutral" className="text-[10px] tracking-wider uppercase font-bold">Staff</Badge>;
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Identity & Governance"
        subtitle="Manage personnel clearance levels, access vectors, and corporate account registries."
        actions={
          <Button variant="primary" icon={UserPlus} onClick={() => handleOpenPopupModal()}>
            Provision Account
          </Button>
        }
      />

      <GlobalCommandBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search operator identities or email nodes..."
        filters={[
          { label: 'All Operators', active: true, onClick: () => { } },
          { label: `Registry: ${users.length}`, active: false, onClick: () => { } }
        ]}
      />

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <DataTable headers={['Operator Identity', 'Authorization Level', 'Operational State', 'Registry Actions']}>
          <AnimatePresence mode="popLayout">
            {filteredUsers.map((user) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hover:bg-slate-50/50 transition-colors group cursor-default"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center font-bold text-sm tracking-tighter group-hover:bg-primary-600 group-hover:text-white transition-all">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-tight uppercase tracking-tight">{user.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5 uppercase">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getRoleBadge(user.role)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      user.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                    )} />
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest transition-colors",
                      user.isActive ? "text-emerald-600" : "text-slate-400"
                    )}>
                      {user.isActive ? 'Connection Active' : 'De-provisioned'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  {user.role !== UserRole.ADMIN ? (
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenPopupModal(user)} 
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setUserToDelete(user)} 
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end pr-3">
                      <Badge variant="premium" className="opacity-40 select-none cursor-not-allowed grayscale">Locked Profile</Badge>
                    </div>
                  )}
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </DataTable>
      </div>

      {/* Account Provisioning Panel */}
      <PopupModal
        isOpen={isPopupModalOpen}
        onClose={() => setIsPopupModalOpen(false)}
        title={editingUser ? "Modify Governance Node" : "Initialize Identity Node"}
        icon={Fingerprint}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Personnel Identity (Full Name)" 
            required 
            value={formData.name} 
            onChange={e => setFormData({ ...formData, name: e.target.value })} 
            icon={User} 
            placeholder="e.g. Johnathan Architect"
          />
          <Input 
            label="Authorization Endpoint (Email)" 
            type="email" 
            required 
            value={formData.email} 
            onChange={e => setFormData({ ...formData, email: e.target.value })} 
            icon={Mail} 
            placeholder="john@enterprise.io"
          />
          <Input 
            label="Security Signature (Password)" 
            type="password" 
            required={!editingUser} 
            value={formData.password} 
            onChange={e => setFormData({ ...formData, password: e.target.value })} 
            icon={Key} 
            placeholder={editingUser ? "Leave blank to maintain current" : "Min 8 characters required"}
          />

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Authorization Magnitude</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-[52px] pr-6 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold text-slate-700 appearance-none cursor-pointer"
              >
                <option value={UserRole.STAFF}>Staff Level</option>
                <option value={UserRole.MANAGER}>Manager Level</option>
                {/* Admin tier is hidden to maintain single account policy */}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsPopupModalOpen(false)}>
              Discard
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {editingUser ? "Commit Changes" : "Provision Identity"}
            </Button>
          </div>
        </form>
      </PopupModal>

      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Revoke System Clearance"
        icon={ShieldAlert}
        message={`CRITICAL: You are about to permanently decommission the operator account for "${userToDelete?.name}". This action will terminate all associated active sessions immediately.`}
        confirmLabel="Decommission Account"
      />
    </div>
  );
};

export default UsersPage;