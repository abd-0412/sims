
import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface UIContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: number) => void;
  isDrawerOpen: boolean;
  toggleDrawer: (open: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <UIContext.Provider value={{ toasts, showToast, removeToast, isDrawerOpen, toggleDrawer: setIsDrawerOpen }}>
      {children}
      {/* Toast Portal */}
      <div className="fixed bottom-24 lg:bottom-10 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-right-10 duration-300 ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' :
              toast.type === 'error' ? 'bg-rose-500/90 border-rose-400 text-white' :
                toast.type === 'warning' ? 'bg-amber-500/90 border-amber-400 text-white' : 'bg-slate-800/90 border-slate-700 text-white'
            }`}>
            <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' :
                toast.type === 'error' ? 'fa-circle-xmark' :
                  toast.type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'
              }`}></i>
            <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        ))}
      </div>
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
};
