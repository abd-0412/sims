import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '../context/InventoryContext';
import { UserRole } from '../types';
import { Card, Badge, Button, Input, PageHeader } from '../components/UIComponents';

const ProfilePage: React.FC = () => {
  const { updateUser, transactions, logs } = useInventory();
  const currentUserRaw = localStorage.getItem('current_user');
  const user = currentUserRaw ? JSON.parse(currentUserRaw) : null;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const stats = useMemo(() => {
    if (!user) return { actions: 0, logs: 0 };
    const myTransactions = transactions.filter(t => t.createdBy === user.id).length;
    const myLogs = logs.filter(l => l.userId === user.id).length;
    return { actions: myTransactions, logs: myLogs };
  }, [transactions, logs, user]);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('Credential mismatch: Passwords do not align.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Security violation: Key must be at least 6 characters.');
      return;
    }

    updateUser(user.id, { password: newPassword }, user.id);
    setNewPassword('');
    setConfirmPassword('');
    setSuccess(true);

    const updatedUser = { ...user, password: newPassword };
    localStorage.setItem('current_user', JSON.stringify(updatedUser));
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-12 page-transition">
      <PageHeader
        title="User Profile"
        subtitle="Manage your details, change password, and view activity."
      />

      <Card className="flex flex-col md:flex-row items-center gap-12 border-white/40 p-10 lg:p-14 bg-gradient-to-br from-white/40 to-slate-50/10">
        <div className="relative">
          <div className="w-36 h-36 lg:w-44 lg:h-44 bg-slate-950 rounded-[40px] flex items-center justify-center text-6xl text-white font-black shadow-2xl relative z-10 border-4 border-white/50">
            {user.name.charAt(0)}
          </div>
          <div className="absolute -inset-4 bg-indigo-500/10 blur-2xl rounded-full -z-0"></div>
        </div>

        <div className="text-center md:text-left space-y-4 flex-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-950 tracking-tight uppercase italic">{user.name}</h1>
            <Badge variant="premium">{user.role}</Badge>
          </div>
          <div className="space-y-2">
            <p className="text-slate-500 font-bold tracking-wide text-lg">{user.email}</p>
            <div className="flex items-center justify-center md:justify-start gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <i className="fa-solid fa-calendar-check"></i>
              System Onboarding: {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Security Module */}
        <Card className="border-white/40">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-[13px] font-black text-slate-950 uppercase tracking-[0.2em]">Security Protocol Management</h3>
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
              <i className="fa-solid fa-user-shield"></i>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-8">
            {success && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50/50 border border-emerald-200 text-emerald-600 p-6 rounded-3xl flex items-center gap-4">
                <i className="fa-solid fa-circle-check text-xl"></i>
                <p className="text-[11px] font-black uppercase tracking-widest leading-none">Credentials Updated Successfully</p>
              </motion.div>
            )}
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-50/50 border border-rose-200 text-rose-600 p-6 rounded-3xl flex items-center gap-4">
                <i className="fa-solid fa-circle-exclamation text-xl"></i>
                <p className="text-[11px] font-black uppercase tracking-widest leading-none">{error}</p>
              </motion.div>
            )}

            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password..."
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat your new password..."
            />
            <div className="pt-4">
              <Button type="submit" variant="primary" className="w-full py-6">Update Password</Button>
            </div>
          </form>
        </Card>

        {/* Analytics Module */}
        <div className="space-y-8">
          <Card>
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-[13px] font-black text-[#281C59] uppercase tracking-[0.2em]">Your Activity</h3>
              <Badge variant="info">Live Stats</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="p-8 bg-[#F4F7FB] rounded-[20px] border-[3px] border-[#AACDDC] shadow-[4px_4px_0px_#C9BEFF] hover:shadow-[6px_6px_0px_#281C59] hover:border-[#281C59] transition-all group">
                <p className="text-[10px] font-black text-[#281C59]/60 uppercase tracking-widest mb-3">Transactions</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-[#281C59] tabular-nums">{stats.actions}</span>
                  <span className="text-[10px] font-black text-[#281C59]/50 uppercase tracking-widest">Total</span>
                </div>
              </div>
              <div className="p-8 bg-[#F4F7FB] rounded-[20px] border-[3px] border-[#AACDDC] shadow-[4px_4px_0px_#EEFABD] hover:shadow-[6px_6px_0px_#281C59] hover:border-[#281C59] transition-all group">
                <p className="text-[10px] font-black text-[#281C59]/60 uppercase tracking-widest mb-3">Audit Logs</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-[#281C59] tabular-nums">{stats.logs}</span>
                  <span className="text-[10px] font-black text-[#281C59]/50 uppercase tracking-widest">Recorded</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="p-8 rounded-[24px] bg-[#281C59] text-white border-[3px] border-[#281C59] shadow-[6px_6px_0px_#C9BEFF] relative overflow-hidden">
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-[11px] font-black text-[#C9BEFF] uppercase tracking-[0.3em]">Account Status</p>
                <p className="text-2xl font-black uppercase tracking-tight">Access Active</p>
              </div>
              <div className="w-16 h-16 bg-white/10 border-[3px] border-[#C9BEFF] rounded-[20px] flex items-center justify-center text-3xl">
                <i className="fa-solid fa-award text-[#EEFABD]"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
