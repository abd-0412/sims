import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInventory } from '../context/InventoryContext';
import { PageHeader, Card, DataTable, Badge, GlobalCommandBar, cn } from '../components/UIComponents';

const AuditLogsPage: React.FC = () => {
  const { logs } = useInventory();
  const [filter, setFilter] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter(l =>
      (l.message?.toLowerCase() || '').includes(filter.toLowerCase()) ||
      (l.userName?.toLowerCase() || '').includes(filter.toLowerCase()) ||
      (l.action?.toLowerCase() || '').includes(filter.toLowerCase())
    );
  }, [logs, filter]);

  const getActionTheme = (action: string) => {
    if (action.includes('LOGIN')) return 'premium';
    if (action.includes('STOCK_IN')) return 'success';
    if (action.includes('STOCK_OUT')) return 'danger';
    if (action.includes('USER_CREATE')) return 'info';
    if (action.includes('DELETE')) return 'danger';
    return 'neutral';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN')) return 'fa-key';
    if (action.includes('STOCK_IN')) return 'fa-box-open';
    if (action.includes('STOCK_OUT')) return 'fa-truck-loading';
    if (action.includes('USER_CREATE')) return 'fa-user-plus';
    if (action.includes('DELETE')) return 'fa-trash-can';
    return 'fa-gear';
  };

  return (
    <div className="space-y-10 page-transition pb-20">
      <PageHeader
        title="Audit Logs"
        subtitle="Immutable security ledger of every atomic system event and operator state shift."
      />

      <GlobalCommandBar
        searchValue={filter}
        onSearchChange={setFilter}
        searchPlaceholder="Search within the audit stream... (Alt+S)"
        filters={[
          { label: 'All', active: filter === '', onClick: () => setFilter('') },
          { label: 'Login', active: filter === 'LOGIN', onClick: () => setFilter('LOGIN') },
          { label: 'Stock', active: filter === 'STOCK', onClick: () => setFilter('STOCK') },
          { label: 'User', active: filter === 'USER', onClick: () => setFilter('USER') },
          { label: 'CSV', active: filter === 'CSV', onClick: () => setFilter('CSV') },
        ]}
      />

      <DataTable headers={['Date', 'Action', 'Authenticated Operator', 'System Reason']}>
        <AnimatePresence>
          {filteredLogs.map((log, idx) => {
            const theme = getActionTheme(log.action);
            return (
              <motion.tr
                key={log.id || idx}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-[3px] border-[#AACDDC] shadow-[4px_4px_0px_#EBE5FF] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_#281C59] transition-all group"
              >
                <td className="px-8 py-6 border-b-[3px] border-[#AACDDC]">
                  <div className="flex flex-col gap-2">
                    <span className="text-[14px] font-black text-[#281C59] tabular-nums uppercase">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-[#AACDDC] uppercase tracking-widest">Fixed Point</span>
                  </div>
                </td>
                <td className="px-8 py-6 border-b-[3px] border-[#AACDDC]">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center border-[3px] shadow-[2px_2px_0px_#281C59] text-[20px]",
                      theme === 'danger' ? 'bg-[#DB1A1A] text-white border-[#281C59]' :
                        theme === 'success' ? 'bg-[#EEFABD] text-[#281C59] border-[#281C59]' :
                          'bg-[#C9BEFF] text-[#281C59] border-[#281C59]'
                    )}>
                      <i className={`fa-solid ${getActionIcon(log.action)}`}></i>
                    </div>
                    <Badge variant={theme as 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'premium'}>{log.action}</Badge>
                  </div>
                </td>
                <td className="px-8 py-6 border-b-[3px] border-[#AACDDC]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#281C59] text-white flex items-center justify-center text-[12px] font-black border-[2px] border-[#281C59] shadow-[2px_2px_0px_#AACDDC]">
                      {log.userName?.charAt(0) || 'S'}
                    </div>
                    <span className="text-[14px] font-black text-[#281C59] uppercase tracking-tight">{log.userName}</span>
                  </div>
                </td>
                <td className="px-8 py-6 border-b-[3px] border-[#AACDDC] w-1/3">
                  <p className="text-[12px] font-bold text-[#281C59] leading-relaxed relative">
                    <span className="absolute -left-3 top-1 text-[#C9BEFF] text-[8px]"><i className="fa-solid fa-quote-left"></i></span>
                    {log.message}
                  </p>
                </td>
              </motion.tr>
            );
          })}
        </AnimatePresence>
      </DataTable>
    </div>
  );
};

export default AuditLogsPage;
