import React from 'react';
import { Invoice } from '../types';
import { formatCurrency } from '../services/pdfService';
import { FileText, IndianRupee, Calendar, Layers } from 'lucide-react';

interface StatsOverviewProps {
  invoices: Invoice[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ invoices }) => {
  const totalInvoices = invoices.length;
  const currency = invoices[0]?.currency || 'INR';

  const totalBilled = invoices.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const avgBilled = totalInvoices > 0 ? totalBilled / totalInvoices : 0;
  
  // Find latest invoice by number
  const latestInvoice = invoices.length > 0 
    ? [...invoices].sort((a, b) => (parseInt(b.invoiceNumber, 10) || 0) - (parseInt(a.invoiceNumber, 10) || 0))[0]
    : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Invoices */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Invoices</span>
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0284c7] flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-zinc-900 font-mono">{totalInvoices}</div>
          <div className="text-xs text-zinc-500 mt-1">Synced with Google Sheet</div>
        </div>
      </div>

      {/* Total Invoiced Volume */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Billed Volume</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-zinc-900 font-mono">{formatCurrency(totalBilled, currency)}</div>
          <div className="text-xs text-zinc-500 mt-1">Across all generated invoices</div>
        </div>
      </div>

      {/* Average Invoice Value */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Average / Invoice</span>
          <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-zinc-900 font-mono">{formatCurrency(avgBilled, currency)}</div>
          <div className="text-xs text-zinc-500 mt-1">Average per customer cycle</div>
        </div>
      </div>

      {/* Latest Billing Info */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Latest Invoice</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-zinc-900 font-mono">
            {latestInvoice ? `#${latestInvoice.invoiceNumber}` : '—'}
          </div>
          <div className="text-xs text-zinc-500 mt-1 truncate">
            {latestInvoice ? `${latestInvoice.customerName.split('|')[0].trim()}` : 'Ready to create'}
          </div>
        </div>
      </div>
    </div>
  );
};

