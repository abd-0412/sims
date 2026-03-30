import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, X, AlertTriangle, CheckCircle2, Info, 
  ChevronRight, ArrowUpRight, ArrowDownRight, MoreVertical,
  Edit, Trash2, Eye, Filter, Loader2
} from 'lucide-react';

// Helper for conditional classes
export const cn = (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' ');

// Modern Success/Warning/Danger Badges
export const Badge: React.FC<{ children: React.ReactNode, variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral', className?: string }> = ({ children, variant = 'neutral', className }) => {
  const styles = {
    success: 'bg-green-50 text-green-700 border-green-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-full text-xs font-semibold border inline-flex items-center gap-1",
      styles[variant],
      className
    )}>
      {children}
    </span>
  );
};

// Premium Card
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode, noPadding?: boolean }> = ({ children, className = '', noPadding, ...props }) => (
  <div
    className={cn(
      "bg-white border border-slate-200 rounded-xl shadow-soft transition-all duration-200",
      !noPadding && "p-6",
      className
    )}
    {...props as any}
  >
    {children}
  </div>
);

// SaaS KPI Stat Card
export const StatCard: React.FC<{
  label: string;
  value: string | number;
  trend?: { value: number; isUp: boolean };
  icon: React.ElementType;
  className?: string;
  onClick?: () => void;
}> = ({ label, value, trend, icon: Icon, className, onClick }) => {
  return (
    <Card 
      onClick={onClick}
      className={cn("cursor-pointer hover:shadow-premium group relative overflow-hidden", className)}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <p className="text-sm font-medium text-text-secondary">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-text-primary tracking-tight">{value}</h3>
            {trend && (
              <span className={cn(
                "flex items-center text-xs font-bold",
                trend.isUp ? "text-success" : "text-danger"
              )}>
                {trend.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {trend.value}%
              </span>
            )}
          </div>
        </div>
        <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all duration-300 shadow-sm border border-slate-200/50">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
};

// Professional Input
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string, icon?: React.ElementType, error?: string, required?: boolean }> = ({ label, icon: Icon, error, required, ...props }) => (
  <div className="space-y-1.5 w-full">
    {label && (
      <label className="text-sm font-semibold text-text-primary flex items-center gap-1">
        {label}
        {required && <span className="text-danger">*</span>}
      </label>
    )}
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />}
      <input
        {...props}
        className={cn(
          "w-full bg-white border border-slate-200 rounded-xl py-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-text-primary text-sm placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed",
          Icon ? 'pl-11 pr-4' : 'px-4',
          error ? 'border-danger focus:ring-danger/20' : '',
          props.className
        )}
      />
    </div>
    {error && <p className="text-xs text-danger font-medium">{error}</p>}
  </div>
);

// SaaS Styled Buttons
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant, loading?: boolean, icon?: React.ElementType, fullWidth?: boolean }> = ({ children, variant = 'primary', loading, icon: Icon, fullWidth, ...props }) => {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm active:bg-indigo-800',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm active:bg-red-800',
    outline: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 border-2 active:bg-slate-100',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200',
  };

  return (
    <button
      {...props}
      className={cn(
        "px-5 py-2.5 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 select-none",
        variants[variant],
        fullWidth && "w-full",
        props.className
      )}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon && <Icon className="w-4 h-4" />}
      <span>{children}</span>
    </button>
  );
};

// Clean Page Header
export const PageHeader: React.FC<{ title: string, subtitle: string, actions?: React.ReactNode }> = ({ title, subtitle, actions }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
    <div>
      <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
      <p className="text-text-secondary text-sm mt-1">{subtitle}</p>
    </div>
    <div className="flex items-center gap-3">{actions}</div>
  </div>
);

// Standard Command Bar
export const GlobalCommandBar: React.FC<{
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (val: string) => void;
  filters?: { label: string, active: boolean, onClick: () => void }[];
  primaryAction?: React.ReactNode;
}> = ({ searchPlaceholder = "Search...", searchValue, onSearchChange, filters = [], primaryAction }) => {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6">
      <div className="flex-1 w-full flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
          />
        </div>

        {filters.length > 0 && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
            {filters.map((f, i) => (
              <button
                key={i}
                onClick={f.onClick}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex-1 sm:flex-none",
                  f.active ? "bg-white text-primary-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="w-full lg:w-auto shrink-0 flex justify-end">
        {primaryAction}
      </div>
    </div>
  );
};

// Modal System
export const PopupModal: React.FC<{ 
  isOpen: boolean, 
  onClose: () => void, 
  title: string, 
  children: React.ReactNode,
  icon?: React.ElementType
}> = ({ isOpen, onClose, title, children, icon: Icon }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl bg-white rounded-2xl shadow-premium z-[1001] overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="w-8 h-8 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <h2 className="text-lg font-bold text-text-primary">{title}</h2>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// Standard Data Table
export const DataTable: React.FC<{ headers: string[], children: React.ReactNode }> = ({ headers, children }) => (
  <div className="w-full bg-white border border-slate-200 rounded-xl shadow-soft overflow-hidden">
    <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-100">
            {headers.map((h, i) => (
              <th key={i} className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {children}
        </tbody>
      </table>
    </div>
  </div>
);

// Expandable Table Row
export const ExpandableRow: React.FC<{ 
  mainContent: React.ReactNode, 
  expandedContent: React.ReactNode, 
  isExpanded: boolean, 
  onToggle: () => void 
}> = ({ mainContent, expandedContent, isExpanded, onToggle }) => (
  <>
    <tr 
      onClick={onToggle}
      className={cn(
        "group cursor-pointer transition-all duration-200",
        isExpanded ? "bg-slate-50/80" : "bg-white hover:bg-slate-50/40"
      )}
    >
      {mainContent}
    </tr>
    <AnimatePresence>
      {isExpanded && (
        <tr>
          <td colSpan={100} className="px-0 py-0 border-none">
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden bg-white/50"
            >
              <div className="px-8 py-6 border-b border-slate-100 shadow-inner">
                {expandedContent}
              </div>
            </motion.div>
          </td>
        </tr>
      )}
    </AnimatePresence>
  </>
);

// Animated Row Actions
export const RowActions: React.FC<{ 
  onEdit?: () => void, 
  onDelete?: () => void, 
  onView?: () => void 
}> = ({ onEdit, onDelete, onView }) => (
  <div className="flex items-center gap-1">
    {onView && (
      <button onClick={onView} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all" title="View details">
        <Eye className="w-4.5 h-4.5" />
      </button>
    )}
    {onEdit && (
      <button onClick={onEdit} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Edit row">
        <Edit className="w-4.5 h-4.5" />
      </button>
    )}
    {onDelete && (
      <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete row">
        <Trash2 className="w-4.5 h-4.5" />
      </button>
    )}
  </div>
);

// Standard Confirm View
export const ConfirmModal: React.FC<{ isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string, confirmLabel?: string, isDanger?: boolean }> = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = "Confirm Action", isDanger = true }) => (
  <PopupModal isOpen={isOpen} onClose={onClose} title="">
    <div className="text-center space-y-6 pt-4 pb-2">
      <div className={cn(
        "w-16 h-16 rounded-full flex items-center justify-center mx-auto",
        isDanger ? "bg-red-50 text-red-600" : "bg-primary-50 text-primary-600"
      )}>
        <AlertTriangle className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-text-primary">{title}</h3>
        <p className="text-sm text-text-secondary leading-relaxed max-w-xs mx-auto">{message}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Button variant={isDanger ? "danger" : "primary"} onClick={onConfirm} className="px-8">{confirmLabel}</Button>
        <Button variant="outline" onClick={onClose} className="px-8">Cancel</Button>
      </div>
    </div>
  </PopupModal>
);

// Modern Skeleton Loader
export const SkeletonLoader: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse bg-slate-200 rounded-xl relative overflow-hidden", className)} />
);