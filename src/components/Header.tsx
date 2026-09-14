import React from 'react';
import { GoogleSheetsConfig, GoogleUser } from '../types';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  LogIn, 
  LogOut, 
  Plus, 
  Sparkles,
  Search,
  Filter,
  ArrowUpDown
} from 'lucide-react';

interface HeaderProps {
  user: GoogleUser | null;
  sheetConfig: GoogleSheetsConfig | null;
  isSyncing: boolean;
  onRefresh: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onCreateNew: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  sheetConfig,
  isSyncing,
  onRefresh,
  onLogin,
  onLogout,
  onCreateNew,
  searchQuery,
  onSearchChange
}) => {
  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-xs">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#0284c7] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
            <span>BC</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">Bhadani Complex Invoices</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-sky-50 text-[#0284c7] border border-sky-200">
                Google Sheets & PDF
              </span>
            </div>
            <p className="text-xs text-zinc-500">Satyam Nagar, Dhanbad • Live Google Sheet CRUD & automatic PDF generation</p>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Google Sheet Direct Link badge if connected */}
          {sheetConfig && (
            <a
              href={sheetConfig.sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              id="google-sheet-link-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              title="Open Google Sheet in new tab"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{sheetConfig.spreadsheetName}</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
            </a>
          )}

          {/* Sync Button */}
          {user && (
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              id="sync-sheets-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200 transition-colors disabled:opacity-50"
              title="Sync with Google Sheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-zinc-800' : 'text-zinc-500'}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Sheet'}</span>
            </button>
          )}

          {/* New Invoice Button */}
          <button
            onClick={onCreateNew}
            id="create-invoice-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>

          {/* User Account / Sign In */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full border border-zinc-300" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-zinc-800 truncate max-w-[130px]">{user.name}</div>
                <div className="text-[10px] text-zinc-500 truncate max-w-[130px]">{user.email}</div>
              </div>
              <button
                onClick={onLogout}
                id="sign-out-btn"
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors"
                title="Disconnect Google Account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              id="connect-google-btn"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Connect Google Sheets</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Quick Info Bar */}
      <div className="bg-zinc-50 border-t border-zinc-200 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              id="invoice-search-input"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search invoices by number, customer, purpose..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium">
            <span className="hidden sm:inline">Google Sheets Backend Connected</span>
            <span className="h-3 w-px bg-zinc-300 hidden sm:inline" />
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0284c7] text-white hover:bg-[#0369a1] transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
