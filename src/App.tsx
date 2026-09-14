import React, { useState, useEffect, useCallback } from 'react';
import { Invoice, InvoiceStatus, GoogleSheetsConfig } from './types';
import { useGoogleAuth } from './hooks/useGoogleAuth';
import { 
  getOrCreateInvoiceSheet, 
  readInvoicesFromSheet, 
  appendInvoiceToSheet, 
  updateInvoiceInSheet, 
  deleteInvoiceFromSheet 
} from './services/sheetsService';
import { exportInvoiceToPDF } from './services/pdfService';
import { INITIAL_SEED_INVOICES } from './mockData';
import { getNextInvoiceNumberForTenant } from './constants/tenants';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { InvoiceList } from './components/InvoiceList';
import { InvoiceModal } from './components/InvoiceModal';
import { InvoicePreviewModal } from './components/InvoicePreviewModal';
import { 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  Key, 
  Info,
  Layers,
  ArrowRight,
  Trash2
} from 'lucide-react';

export default function App() {
  const { 
    token, 
    user, 
    isLoading: isAuthLoading, 
    authError, 
    login, 
    logout,
    setManualToken,
    isAuthenticated 
  } = useGoogleAuth();

  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('local_invoices_cache_v5');
    return saved ? JSON.parse(saved) : INITIAL_SEED_INVOICES;
  });

  const [sheetConfig, setSheetConfig] = useState<GoogleSheetsConfig | null>(() => {
    const saved = localStorage.getItem('invoice_sheets_config');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoadingInvoices, setIsLoadingInvoices] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Token helper modal state (for easy debugging or direct token input if iframe blocks popups)
  const [showTokenPrompt, setShowTokenPrompt] = useState<boolean>(false);
  const [customTokenInput, setCustomTokenInput] = useState<string>('');

  // Persist locally as fallback cache
  useEffect(() => {
    localStorage.setItem('local_invoices_cache_v5', JSON.stringify(invoices));
  }, [invoices]);

  // Sync authError into message banner
  useEffect(() => {
    if (authError) {
      setErrorMessage(authError);
    }
  }, [authError]);

  // Load invoices from Google Sheet whenever token is available
  const loadInvoicesFromGoogle = useCallback(async (authToken: string) => {
    setIsLoadingInvoices(true);
    setErrorMessage(null);
    try {
      setSyncStatus('Connecting to Google Sheets...');
      const config = await getOrCreateInvoiceSheet(authToken);
      setSheetConfig(config);

      setSyncStatus('Loading invoices from spreadsheet...');
      const sheetInvoices = await readInvoicesFromSheet(config.spreadsheetId, config.sheetName, authToken);

      if (sheetInvoices.length > 0) {
        localStorage.setItem(`sheet_seeded_${config.spreadsheetId}`, 'true');
        setInvoices(sheetInvoices);
        setSyncStatus(`Synced ${sheetInvoices.length} invoices from Google Sheet`);
      } else {
        setInvoices([]);
        setSyncStatus('0 invoices found in Google Sheet (Ready to create Invoice #1)');
      }
    } catch (err: any) {
      console.error('Failed to load from Google Sheets:', err);
      if (err.message?.includes('401')) {
        logout();
      }
      setErrorMessage(err.message || 'Error communicating with Google Sheets API');
    } finally {
      setIsLoadingInvoices(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  }, [logout]);

  // When token changes / on mount
  useEffect(() => {
    if (token) {
      loadInvoicesFromGoogle(token);
    }
  }, [token, loadInvoicesFromGoogle]);

  // Manual refresh handler
  const handleRefresh = () => {
    if (token) {
      loadInvoicesFromGoogle(token);
    } else {
      login();
    }
  };

  // CREATE or UPDATE Invoice
  const handleSaveInvoice = async (invoiceData: Invoice, autoExportPdf: boolean) => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const isEdit = !!editingInvoice;

      if (token && sheetConfig) {
        setSyncStatus(isEdit ? 'Updating row in Google Sheet...' : 'Adding row to Google Sheet...');
        if (isEdit) {
          await updateInvoiceInSheet(sheetConfig.spreadsheetId, sheetConfig.sheetName, invoiceData, token);
          setInvoices(prev => prev.map(inv => inv.invoiceNumber === invoiceData.invoiceNumber ? invoiceData : inv));
        } else {
          const newRowIndex = await appendInvoiceToSheet(sheetConfig.spreadsheetId, sheetConfig.sheetName, invoiceData, token);
          invoiceData.sheetRowIndex = newRowIndex;
          setInvoices(prev => [invoiceData, ...prev]);
        }
        setSyncStatus(`Successfully synchronized with Google Sheet`);
      } else {
        // Local mode fallback
        if (isEdit) {
          setInvoices(prev => prev.map(inv => inv.id === invoiceData.id ? invoiceData : inv));
        } else {
          setInvoices(prev => [invoiceData, ...prev]);
        }
      }

      // Auto PDF generation
      if (autoExportPdf) {
        await exportInvoiceToPDF(invoiceData, true);
      }

      setIsModalOpen(false);
      setEditingInvoice(null);
    } catch (err: any) {
      console.error('Error saving invoice:', err);
      setErrorMessage(`Failed to save to Google Sheets: ${err.message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  // DELETE Invoice - prompt confirmation modal
  const handleDeleteInvoice = (invoice: Invoice) => {
    setDeletingInvoice(invoice);
  };

  // Perform confirmed deletion from Google Sheet and local state
  const handleConfirmDelete = async () => {
    if (!deletingInvoice) return;
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      if (token) {
        // Ensure we have active sheet configuration
        let activeConfig = sheetConfig;
        if (!activeConfig) {
          activeConfig = await getOrCreateInvoiceSheet(token);
          setSheetConfig(activeConfig);
        }

        setSyncStatus(`Deleting invoice #${deletingInvoice.invoiceNumber} from Google Sheet...`);
        const result = await deleteInvoiceFromSheet(
          activeConfig.spreadsheetId, 
          activeConfig.sheetName, 
          deletingInvoice, 
          token
        );

        if (result.deletedRows > 0) {
          setSyncStatus(`Invoice #${deletingInvoice.invoiceNumber} deleted from Google Sheet`);
        } else {
          setSyncStatus(`Invoice #${deletingInvoice.invoiceNumber} removed (not found in Google Sheet)`);
        }

        // Fetch fresh records directly from the sheet to guarantee 100% data and row alignment
        const freshInvoices = await readInvoicesFromSheet(
          activeConfig.spreadsheetId, 
          activeConfig.sheetName, 
          token
        );
        setInvoices(freshInvoices);
      } else {
        // Not connected to Google: remove from local cache only
        setInvoices(prev => prev.filter(i => i.invoiceNumber !== deletingInvoice.invoiceNumber));
        setSyncStatus(`Removed invoice #${deletingInvoice.invoiceNumber} from local view`);
      }

      setDeletingInvoice(null);
    } catch (err: any) {
      console.error('Error deleting invoice from Google Sheet:', err);
      setErrorMessage(`Failed to delete invoice #${deletingInvoice.invoiceNumber} from Google Sheet: ${err.message}`);
    } finally {
      setIsDeleting(false);
      setTimeout(() => setSyncStatus(null), 3500);
    }
  };

  // QUICK STATUS UPDATE
  const handleQuickStatusChange = async (invoice: Invoice, newStatus: InvoiceStatus) => {
    const updated = { ...invoice, status: newStatus, updatedAt: new Date().toISOString() };
    
    // Update local state immediately for snappy UI
    setInvoices(prev => prev.map(i => i.invoiceNumber === invoice.invoiceNumber ? updated : i));

    if (token && sheetConfig) {
      try {
        setSyncStatus(`Updating status to ${newStatus} in Google Sheet...`);
        await updateInvoiceInSheet(sheetConfig.spreadsheetId, sheetConfig.sheetName, updated, token);
        setSyncStatus('Status updated in Google Sheet');
      } catch (err: any) {
        console.error('Error updating status in sheet:', err);
        setErrorMessage(`Sheet status update failed: ${err.message}`);
      } finally {
        setTimeout(() => setSyncStatus(null), 3000);
      }
    }
  };

  // Next suggested invoice number (calculated per-tenant inside InvoiceModal, with Dr Saket as default)
  const suggestedInvoiceNumber = getNextInvoiceNumberForTenant(invoices, 'saket');

  // Filtered invoices by search query
  const filteredInvoices = invoices.filter(inv => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(query) ||
      inv.customerName.toLowerCase().includes(query) ||
      (inv.forPurpose && inv.forPurpose.toLowerCase().includes(query)) ||
      (inv.customerAddress && inv.customerAddress.toLowerCase().includes(query)) ||
      inv.items.some(i => i.description.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 flex flex-col font-sans antialiased">
      
      {/* App Header */}
      <Header
        user={user}
        sheetConfig={sheetConfig}
        isSyncing={isLoadingInvoices}
        onRefresh={handleRefresh}
        onLogin={login}
        onLogout={logout}
        onCreateNew={() => {
          setEditingInvoice(null);
          setIsModalOpen(true);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Sync Status Banner */}
      {syncStatus && (
        <div className="bg-zinc-900 text-zinc-100 text-xs py-2 px-4 shadow-sm flex items-center justify-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 text-xs py-2.5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Google Sheets Connection Prompt if not connected */}
        {!user && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 mb-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">Connect your Google Account for real-time Sheet synchronization</h3>
                <p className="text-xs text-emerald-800/80 mt-0.5 max-w-2xl">
                  Every invoice created, edited, or deleted will automatically update a live spreadsheet in your Google Drive. You can also export PDFs directly to your computer.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
              <button
                onClick={login}
                id="connect-google-banner-btn"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors shrink-0"
              >
                <span>Authorize Google Sheets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-emerald-800 hover:bg-emerald-100/70 border border-emerald-300/60 transition-colors"
                title="If popup is blocked in iframe preview, open in a new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Tab</span>
              </a>
            </div>
          </div>
        )}

        {/* Google Sheets Connected Card */}
        {user && sheetConfig && (
          <div className="bg-white border border-zinc-200 rounded-xl p-3.5 mb-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                  <span>Google Sheet Backend:</span>
                  <span className="font-mono text-emerald-700 font-bold">{sheetConfig.spreadsheetName}</span>
                  <span className="text-zinc-400">({sheetConfig.sheetName})</span>
                </div>
                <div className="text-[11px] text-zinc-500">
                  CRUD operations are synchronized live with your Google Drive spreadsheet.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={sheetConfig.sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="open-sheet-header-link"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-200 font-semibold transition-colors text-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Open in Google Sheets</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
            </div>
          </div>
        )}

        {/* Dashboard Financial Stats */}
        <StatsOverview invoices={invoices} />

        {/* Invoice Management Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">Customer Invoices</h2>
            <div className="text-xs text-zinc-500 font-medium">
              Click <span className="font-semibold text-zinc-800">PDF</span> to export instantly
            </div>
          </div>

          <InvoiceList
            invoices={filteredInvoices}
            isLoading={isLoadingInvoices}
            onEdit={(inv) => {
              setEditingInvoice(inv);
              setIsModalOpen(true);
            }}
            onDelete={handleDeleteInvoice}
            onView={(inv) => setPreviewInvoice(inv)}
            onStatusChange={handleQuickStatusChange}
            sheetUrl={sheetConfig?.sheetUrl}
            onCreateFirst={() => {
              setEditingInvoice(null);
              setIsModalOpen(true);
            }}
          />
        </div>

      </main>

      {/* Invoice Create / Edit Modal */}
      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingInvoice(null);
        }}
        onSave={handleSaveInvoice}
        editingInvoice={editingInvoice}
        isSaving={isSaving}
        invoices={invoices}
        suggestedInvoiceNumber={suggestedInvoiceNumber}
      />

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        invoice={previewInvoice}
        isOpen={!!previewInvoice}
        onClose={() => setPreviewInvoice(null)}
      />

      {/* Delete Confirmation Modal */}
      {deletingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-zinc-900">
                  Delete Invoice #{deletingInvoice.invoiceNumber}?
                </h3>
                <p className="text-xs text-zinc-600 mt-1">
                  Tenant: <span className="font-semibold text-zinc-900">{deletingInvoice.customerName}</span>
                  {deletingInvoice.forPurpose && ` (${deletingInvoice.forPurpose})`}
                </p>
                <div className="mt-3 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs">
                  {token ? (
                    <div className="flex items-start gap-2 text-rose-700 font-medium">
                      <FileSpreadsheet className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                      <span>
                        This will permanently delete invoice <strong className="font-bold">#{deletingInvoice.invoiceNumber}</strong> from your connected Google Sheet registry.
                      </span>
                    </div>
                  ) : (
                    <div className="text-amber-700 font-medium">
                      Google Sheets is not authorized. Deleting will only remove this invoice from local view.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingInvoice(null)}
                id="cancel-delete-modal-btn"
                className="px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                id="confirm-delete-modal-btn"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting from Sheet...</span>
                  </>
                ) : (
                  <span>Delete from Sheet</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200 py-4 px-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Invoice Studio &bull; Google Sheets API CRUD & Automated PDF Exporter</span>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Authenticated Scopes: Google Sheets & Drive File</span>
            {sheetConfig && (
              <a href={sheetConfig.sheetUrl} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">
                View Live Sheet
              </a>
            )}
          </div>
        </div>
      </footer>

    </div>
  );
}
