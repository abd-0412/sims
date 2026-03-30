import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpRight, ArrowDownLeft, Clock, User as UserIcon, 
  Search, Filter, History, Box, Tag, ArrowRightLeft, Copyright
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { PageHeader, GlobalCommandBar, Badge, DataTable, Card, cn } from '../components/UIComponents';

const TransactionsPage: React.FC = () => {
  const { transactions } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = (t.productName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (t.reason?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [transactions, searchTerm, typeFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaction Ledger"
        subtitle="A complete audit trail of all inventory movements and stock adjustments."
        actions={
          <Badge variant="info" className="py-2 px-4">
            <History className="w-4 h-4 mr-2" />
            Total: {transactions.length}
          </Badge>
        }
      />

      <GlobalCommandBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search product, reason or technician..."
        filters={[
          { label: 'All History', active: typeFilter === 'all', onClick: () => setTypeFilter('all') },
          { label: 'Stock In', active: typeFilter === 'IN', onClick: () => setTypeFilter('IN') },
          { label: 'Stock Out', active: typeFilter === 'OUT', onClick: () => setTypeFilter('OUT') },
        ]}
      />

      <Card className="px-0 py-0 overflow-hidden">
        <DataTable headers={['Movement Details', 'Classification', 'Target Product', 'Brand Identity', 'Magnitude', 'Technician']}>
          {filtered.map((t, idx) => {
            const isIn = t.type === 'IN';
            return (
              <tr 
                key={t.id || idx}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-none">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                        {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={isIn ? 'success' : 'danger'}>
                    {isIn ? (
                      <><ArrowDownLeft className="w-3 h-3 mr-1" /> Stock In</>
                    ) : (
                      <><ArrowUpRight className="w-3 h-3 mr-1" /> Stock Out</>
                    )}
                  </Badge>
                </td>
                 <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      isIn ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                      <Box className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-900">{t.productName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Copyright className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">{t.brandName || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col items-end">
                    <span className={cn(
                      "text-lg font-bold tracking-tight",
                      isIn ? "text-emerald-600" : "text-red-600"
                    )}>
                      {isIn ? '+' : '-'}{t.quantity}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{t.reason || 'No details'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-[10px] border border-primary-200">
                      {t.createdByName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-none">{t.createdByName}</p>
                      <p className="text-[10px] font-black text-emerald-600 mt-1 uppercase tracking-widest">Verified</p>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
      </Card>
    </div>
  );
};

export default TransactionsPage;
