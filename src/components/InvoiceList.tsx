import React from 'react';
import { Invoice, InvoiceStatus } from '../types';
import { formatCurrency, exportInvoiceToPDF } from '../services/pdfService';
import { 
  FileDown, 
  Edit3, 
  Trash2, 
  Calendar, 
  ExternalLink,
  Eye,
  FileSpreadsheet
} from 'lucide-react';

interface InvoiceListProps {
  invoices: Invoice[];
  isLoading: boolean;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  onView: (invoice: Invoice) => void;
  onStatusChange?: (invoice: Invoice, newStatus: InvoiceStatus) => void;
  sheetUrl?: string;
  onCreateFirst: () => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  isLoading,
  onEdit,
  onDelete,
  onView,
  sheetUrl,
  onCreateFirst
}) => {

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center shadow-2xs">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-zinc-900 border-t-transparent mb-3" />
        <p className="text-sm font-medium text-zinc-600">Reading records from Google Sheets...</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center mb-4">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-zinc-900">No invoices found</h3>
        <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 mb-5">
          You haven't generated any invoices yet or no invoices matched your search filter. Create your first invoice to automatically save it into your Google Sheet.
        </p>
        <button
          onClick={onCreateFirst}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-xs"
        >
          Create First Invoice
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 text-left">
          <thead className="bg-zinc-50">
            <tr>
              <th scope="col" className="px-5 py-3 text-xs font-bold text-zinc-600 uppercase tracking-wider">
                Invoice #
              </th>
              <th scope="col" className="px-5 py-3 text-xs font-bold text-zinc-600 uppercase tracking-wider">
                Client / Customer
              </th>
              <th scope="col" className="px-5 py-3 text-xs font-bold text-zinc-600 uppercase tracking-wider">
                Date & Due
              </th>
              <th scope="col" className="px-5 py-3 text-xs font-bold text-zinc-600 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-5 py-3 text-right text-xs font-bold text-zinc-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-zinc-100">
            {invoices.map((inv) => (
              <tr 
                key={inv.invoiceNumber || inv.id}
                className="hover:bg-zinc-50/80 transition-colors group"
              >
                {/* Invoice # */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-zinc-900">
                      {inv.invoiceNumber}
                    </span>
                    {inv.sheetRowIndex && (
                      <span className="text-[10px] text-zinc-400 font-mono" title={`Row ${inv.sheetRowIndex} in Google Sheet`}>
                        (Row {inv.sheetRowIndex})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {inv.items.length} item{inv.items.length === 1 ? '' : 's'}
                  </div>
                </td>

                {/* Customer & FOR Purpose */}
                <td className="px-5 py-4">
                  <div className="text-xs font-bold text-zinc-900">{inv.customerName}</div>
                  {inv.forPurpose ? (
                    <div className="text-[11px] font-medium text-[#0284c7] mt-0.5">
                      FOR: {inv.forPurpose}
                    </div>
                  ) : null}
                  {inv.customerAddress && (
                    <div className="text-[11px] text-zinc-500 truncate max-w-xs">{inv.customerAddress}</div>
                  )}
                </td>

                {/* Date & Due */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="text-xs text-zinc-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{inv.date}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Due: {inv.dueDate || 'Upon receipt'}
                  </div>
                </td>

                {/* Amount */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-zinc-900 font-mono">
                    {formatCurrency(inv.total, inv.currency)}
                  </div>
                  {inv.taxTotal > 0 && (
                    <div className="text-[10px] text-zinc-400">
                      incl. {formatCurrency(inv.taxTotal, inv.currency)} tax
                    </div>
                  )}
                </td>

                {/* Actions: View, PDF Export, Edit, Delete */}
                <td className="px-5 py-4 whitespace-nowrap text-right text-xs">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* View Preview Modal */}
                    <button
                      onClick={() => onView(inv)}
                      id={`preview-btn-${inv.invoiceNumber}`}
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                      title="Preview Invoice"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Export PDF */}
                    <button
                      onClick={() => exportInvoiceToPDF(inv, true)}
                      id={`export-pdf-btn-${inv.invoiceNumber}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-medium rounded-md transition-colors text-xs"
                      title="Download PDF"
                    >
                      <FileDown className="w-3.5 h-3.5 text-zinc-700" />
                      <span>PDF</span>
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => onEdit(inv)}
                      id={`edit-invoice-btn-${inv.invoiceNumber}`}
                      className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      title="Edit Invoice details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDelete(inv)}
                      id={`delete-invoice-btn-${inv.invoiceNumber}`}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Delete Invoice from Google Sheet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Table Footer information */}
      <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
        <span>Showing {invoices.length} active invoices</span>
        {sheetUrl && (
          <a
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-medium"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Open Google Spreadsheet live database</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
