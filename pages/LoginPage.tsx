import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, ShieldCheck, UserCheck, 
  ChevronRight, AlertCircle, Warehouse, 
  Zap, Database, BarChart3, Users, 
  Globe, ShieldAlert, Fingerprint, LucideIcon
} from 'lucide-react';
import { User, UserRole } from '../types';
import { Input, Button, Badge, cn } from '../components/UIComponents';
import api from '../services/api';

interface LoginPageProps {
  onLogin: (user: User, token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;

      if (!user.isActive) {
        setError('Security Protocol: Account Access Suspended');
        setLoading(false);
        return;
      }

      onLogin(user, token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication error: connection refused');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans overflow-hidden">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center p-8 lg:p-24 relative z-10 bg-white shadow-2xl shrink-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md mx-auto space-y-10"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                <Warehouse className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">Smart Inventory Management System (SIMS)</span>
            </div>
            <div className="pt-4">
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-tight">Access Portal</h1>
              <p className="text-slate-400 font-semibold mt-2">Manage stock, reports, and analytics easily.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-5">
              <Input
                label="Identity Endpoint (Email)"
                icon={Mail}
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@sims.io"
              />

              <div className="space-y-1">
                <Input
                  label="Secure Signature (Password)"
                  icon={Lock}
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <div className="flex justify-end">
                  <button type="button" className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest bg-transparent border-none p-0">Forgot Password?</button>
                </div>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full py-4.5 text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20">
              Initialize Dashboard Session
            </Button>
          </form>

          <div className="pt-8 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            <span>v4.0.0 Stable</span>
            <span>SIMS Enterprise</span>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Visual Branding */}
      <div className="hidden lg:flex flex-1 bg-slate-900 relative overflow-hidden items-center justify-center p-20">
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Abstract Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-2xl bg-white/5 backdrop-blur-xl rounded-[40px] border border-white/10 p-16 shadow-2xl overflow-hidden"
        >
          {/* Glass Effect Ornament */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          
          <div className="space-y-6 text-white relative z-10">
            <div className="space-y-6">
              <h2 className="text-5xl font-black leading-tight tracking-tight text-white">
                Smart Inventory <br />
                <span className="text-primary-400">Management System (SIMS)</span>
              </h2>
              <p className="text-lg text-slate-300 max-w-md leading-relaxed font-medium">
                Professional-grade inventory tracking and warehouse operations management.
              </p>
            </div>

            <div className="flex items-center gap-4 pt-8 border-t border-white/10 text-slate-400">
               <ShieldCheck className="w-5 h-5 text-emerald-400" />
               <p className="text-xs font-bold uppercase tracking-wider">Secure AES-256 Encrypted Session</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
