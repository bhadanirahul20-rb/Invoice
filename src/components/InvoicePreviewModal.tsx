import React, { useRef, useState } from 'react';
import { Invoice } from '../types';
import { exportInvoiceToPDF } from '../services/pdfService';
import { InvoiceTemplate } from './InvoiceTemplate';
import { X, FileDown, Printer, Loader2 } from 'lucide-react';

interface InvoicePreviewModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  invoice,
  isOpen,
  onClose
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      await exportInvoiceToPDF(invoice, true, templateRef.current);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-zinc-100 rounded-2xl border border-zinc-200 shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 bg-white border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Invoice Preview</span>
            <span className="text-xs font-mono font-bold text-zinc-900 bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 rounded-md">
              #{invoice.invoiceNumber}
            </span>
            {invoice.forPurpose && (
              <span className="text-xs font-medium text-[#0284c7] bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-md">
                {invoice.forPurpose}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-300 rounded-lg transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              disabled={isExporting}
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg transition-colors shadow-2xs disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
              <span>{isExporting ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Body View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-200/60">
          <div className="shadow-lg rounded-sm overflow-hidden bg-white">
            <InvoiceTemplate
              ref={templateRef}
              id="invoice-render-target"
              invoice={invoice}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
