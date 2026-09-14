import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem, InvoiceStatus } from '../types';
import { formatCurrency } from '../services/pdfService';
import { 
  TENANT_PRESETS, 
  TenantPreset, 
  getTenantId, 
  getNextInvoiceNumberForTenant 
} from '../constants/tenants';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Building2, 
  User, 
  Calendar, 
  FileSpreadsheet,
  FileText,
  Sparkles,
  RefreshCw,
  Check
} from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice, autoExportPdf: boolean) => Promise<void>;
  editingInvoice: Invoice | null;
  isSaving: boolean;
  invoices?: Invoice[];
  suggestedInvoiceNumber?: string;
}

const DEFAULT_COMPANY = {
  name: 'Bhadani Complex',
  email: 'dineshbhadani05@gmail.com',
  address: 'Satyam Nagar, Dhanbad, 826001',
  phone: '9431163109',
  taxId: ''
};

// Today's date formatted e.g. "13 September, 2026"
export function getTodayFormatted(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${day} ${monthNames[d.getMonth()]}, ${d.getFullYear()}`;
}

// Previous month details from reference date
export function getPreviousMonthInfo(baseDate = new Date()) {
  const prevDate = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[prevDate.getMonth()];
  const year = prevDate.getFullYear();
  return {
    monthName,
    year,
    forPurpose: `Rent for ${monthName} ${year}`,
    rentDesc: `${monthName} Rent`
  };
}

// Current month details from reference date
export function getCurrentMonthInfo(baseDate = new Date()) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[baseDate.getMonth()];
  const year = baseDate.getFullYear();
  return {
    monthName,
    year,
    forPurpose: `Rent for ${monthName} ${year}`,
    rentDesc: `${monthName} Rent`
  };
}

export function parseInvoiceBaseDate(dateStr?: string): Date {
  if (!dateStr) return new Date();
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingInvoice,
  isSaving,
  invoices = [],
  suggestedInvoiceNumber
}) => {
  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState<string>(() => {
    return suggestedInvoiceNumber || getNextInvoiceNumberForTenant(invoices, 'saket');
  });
  const [date, setDate] = useState<string>(getTodayFormatted());
  const [dueDate, setDueDate] = useState<string>('');
  const [currency, setCurrency] = useState<string>('INR');

  // Company details
  const [companyName, setCompanyName] = useState<string>(DEFAULT_COMPANY.name);
  const [companyEmail, setCompanyEmail] = useState<string>(DEFAULT_COMPANY.email);
  const [companyAddress, setCompanyAddress] = useState<string>(DEFAULT_COMPANY.address);
  const [companyPhone, setCompanyPhone] = useState<string>(DEFAULT_COMPANY.phone);

  // Customer / Tenant details
  const [customerName, setCustomerName] = useState<string>('Dr Saket Narnoli | Urologia');
  const [customerAddress, setCustomerAddress] = useState<string>('Urologia Hospital, Bhadani Complex');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Purpose (FOR)
  const prevInfo = getPreviousMonthInfo();
  const [forPurpose, setForPurpose] = useState<string>(prevInfo.forPurpose);

  // Items - 4 line items with descriptions only, empty amounts for user to enter
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [taxRate, setTaxRate] = useState<string>('');
  const [additionalCosts, setAdditionalCosts] = useState<number>(0);
  const [contactPersonInfo, setContactPersonInfo] = useState<string>(
    'Dr D. P. Bhadani +91-9431163109, dineshbhadani05@gmail.com'
  );
  const [footerMessage, setFooterMessage] = useState<string>('THANK YOU FOR YOUR BUSINESS!');
  const [notes, setNotes] = useState<string>('');
  const [autoExportPdf, setAutoExportPdf] = useState<boolean>(true);

  // Function to apply a specific Tenant Preset (Dr. Saket or Dr. Gunjesh)
  const applyTenantPreset = (preset: TenantPreset) => {
    const baseDate = parseInvoiceBaseDate(date);
    const monthInfo = preset.rentMonthType === 'current'
      ? getCurrentMonthInfo(baseDate)
      : getPreviousMonthInfo(baseDate);

    setCustomerName(preset.customerName);
    setCustomerAddress(preset.customerAddress);
    setForPurpose(monthInfo.forPurpose);

    // Populate the specific tenant's next sequential invoice number!
    if (!editingInvoice) {
      const nextNum = getNextInvoiceNumberForTenant(invoices, preset.id);
      setInvoiceNumber(nextNum);
    }

    if (preset.defaultItems) {
      const defaultItemList = preset.defaultItems(monthInfo.monthName, monthInfo.year);
      setItems(
        defaultItemList.map((item, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          description: item.description,
          amount: item.amount
        }))
      );
    }
  };

  // Handle Customer Name input changes:
  // Automatically match against tenants, auto-populate address, items, and tenant invoice number
  const handleCustomerNameChange = (val: string) => {
    setCustomerName(val);
    const lower = val.toLowerCase();

    // Find matching tenant
    const matched = TENANT_PRESETS.find(
      p =>
        p.id === lower ||
        p.customerName.toLowerCase().includes(lower) ||
        lower.includes(p.id) ||
        (p.id === 'gunjesh' && (lower.includes('onco') || lower.includes('gunjesh'))) ||
        (p.id === 'saket' && (lower.includes('urologia') || lower.includes('saket')))
    );

    if (matched) {
      setCustomerAddress(matched.customerAddress);
      const baseDate = parseInvoiceBaseDate(date);
      const monthInfo = matched.rentMonthType === 'current'
        ? getCurrentMonthInfo(baseDate)
        : getPreviousMonthInfo(baseDate);
      setForPurpose(monthInfo.forPurpose);

      if (!editingInvoice) {
        const nextNum = getNextInvoiceNumberForTenant(invoices, matched.id);
        setInvoiceNumber(nextNum);
      }

      if (matched.defaultItems && items.length === 0) {
        const defaultItemList = matched.defaultItems(monthInfo.monthName, monthInfo.year);
        setItems(
          defaultItemList.map((item, idx) => ({
            id: `item-${Date.now()}-${idx}`,
            description: item.description,
            amount: item.amount
          }))
        );
      }
    } else if (!editingInvoice) {
      const nextNum = getNextInvoiceNumberForTenant(invoices, val);
      setInvoiceNumber(nextNum);
    }
  };

  // Initialize or reset form
  useEffect(() => {
    if (editingInvoice) {
      setInvoiceNumber(editingInvoice.invoiceNumber);
      setDate(editingInvoice.date || getTodayFormatted());
      setDueDate(editingInvoice.dueDate || '');
      setCurrency(editingInvoice.currency || 'INR');

      setCompanyName(editingInvoice.companyName || DEFAULT_COMPANY.name);
      setCompanyEmail(editingInvoice.companyEmail || DEFAULT_COMPANY.email);
      setCompanyAddress(editingInvoice.companyAddress || DEFAULT_COMPANY.address);
      setCompanyPhone(editingInvoice.companyPhone || DEFAULT_COMPANY.phone);

      setCustomerName(editingInvoice.customerName);
      setCustomerAddress(editingInvoice.customerAddress);
      setCustomerEmail(editingInvoice.customerEmail || '');
      setCustomerPhone(editingInvoice.customerPhone || '');
      setForPurpose(editingInvoice.forPurpose || getPreviousMonthInfo().forPurpose);

      setItems(editingInvoice.items || []);
      setTaxRate(editingInvoice.taxRate || '');
      setAdditionalCosts(editingInvoice.additionalCosts || 0);
      setContactPersonInfo(
        editingInvoice.contactPersonInfo || 'Dr D. P. Bhadani +91-9431163109, dineshbhadani05@gmail.com'
      );
      setFooterMessage(editingInvoice.footerMessage || 'THANK YOU FOR YOUR BUSINESS!');
      setNotes(editingInvoice.notes || '');
    } else {
      // Create new invoice:
      // 1. Invoice date should be today's date by default
      // 2. Customer Dr Saket auto-populated with previous month rent and 4 lines
      const today = getTodayFormatted();
      const prev = getPreviousMonthInfo();

      // Next invoice number for default tenant (Dr Saket):
      // If 0 entries in DB, sets 1. If 1 exists, sets 2.
      const initialNumber = getNextInvoiceNumberForTenant(invoices, 'saket');
      setInvoiceNumber(initialNumber);
      setDate(today);
      setDueDate('');
      setCurrency('INR');

      setCompanyName(DEFAULT_COMPANY.name);
      setCompanyEmail(DEFAULT_COMPANY.email);
      setCompanyAddress(DEFAULT_COMPANY.address);
      setCompanyPhone(DEFAULT_COMPANY.phone);

      setCustomerName('Dr Saket Narnoli | Urologia');
      setCustomerAddress('Urologia Hospital, Bhadani Complex');
      setCustomerEmail('');
      setCustomerPhone('');
      setForPurpose(prev.forPurpose);

      // 4 lines auto-populated with descriptions only; amounts 0 for user entry
      setItems([
        {
          id: `item-${Date.now()}-1`,
          description: prev.rentDesc,
          amount: 0
        },
        {
          id: `item-${Date.now()}-2`,
          description: 'Maintenance',
          amount: 0
        },
        {
          id: `item-${Date.now()}-3`,
          description: 'Electricity',
          amount: 0
        },
        {
          id: `item-${Date.now()}-4`,
          description: 'DG',
          amount: 0
        }
      ]);
      setTaxRate('');
      setAdditionalCosts(0);
      setContactPersonInfo('Dr D. P. Bhadani +91-9431163109, dineshbhadani05@gmail.com');
      setFooterMessage('THANK YOU FOR YOUR BUSINESS!');
      setNotes('');
    }
  }, [editingInvoice, isOpen, suggestedInvoiceNumber]);

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const grandTotal = Math.max(0, subtotal + (Number(additionalCosts) || 0));

  // Add Item
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: '',
      amount: 0
    };
    setItems([...items, newItem]);
  };

  // Update Item
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('An invoice must have at least one line item.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      alert('Please provide an invoice number.');
      return;
    }
    if (!customerName.trim()) {
      alert('Please provide a customer / tenant name.');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one line item.');
      return;
    }

    const payload: Invoice = {
      id: editingInvoice ? editingInvoice.id : invoiceNumber,
      invoiceNumber,
      sheetRowIndex: editingInvoice?.sheetRowIndex,
      date,
      dueDate,
      status: editingInvoice ? editingInvoice.status : 'paid',
      currency,
      companyName,
      companyEmail,
      companyAddress,
      companyPhone,
      customerName,
      customerAddress,
      customerEmail,
      customerPhone,
      forPurpose,
      items,
      subtotal,
      taxRate,
      taxTotal: 0,
      additionalCosts: Number(additionalCosts) || 0,
      discountTotal: 0,
      total: grandTotal,
      contactPersonInfo,
      footerMessage,
      notes,
      createdAt: editingInvoice?.createdAt || date,
      updatedAt: new Date().toISOString()
    };

    await onSave(payload, autoExportPdf);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#0284c7] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                {editingInvoice ? `Edit Invoice: #${editingInvoice.invoiceNumber}` : 'Create New Invoice'}
              </h2>
              <p className="text-xs text-zinc-500">
                Synced with Google Sheet backend and ready for instant PDF export
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top metadata grid - No payment status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-zinc-700">Invoice Number *</label>
                {!editingInvoice && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Tenant Seq: #{invoiceNumber}
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:ring-2 focus:ring-[#0284c7]"
                placeholder="1"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-zinc-700">Invoice Date *</label>
                <button
                  type="button"
                  onClick={() => setDate(getTodayFormatted())}
                  className="text-[11px] font-medium text-[#0284c7] hover:underline inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Set Today</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:ring-2 focus:ring-[#0284c7]"
                placeholder={getTodayFormatted()}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-900 font-medium focus:ring-2 focus:ring-[#0284c7]"
              >
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          {/* Issuer / Customer / FOR Purpose Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Customer / BILL TO */}
            <div className="border border-zinc-200 rounded-xl p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
                <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs">
                  <User className="w-4 h-4 text-[#0284c7]" />
                  <span>BILL TO (Choose Tenant)</span>
                </div>
                <div className="text-[11px] text-zinc-500 font-medium">Select tenant to auto-fill</div>
              </div>

              {/* Quick Tenant Switcher Buttons */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-zinc-600">Select Tenant (Auto-populates Address):</label>
                <div className="grid grid-cols-2 gap-2">
                  {TENANT_PRESETS.map((preset) => {
                    const isSelected = getTenantId(customerName) === preset.id;
                    const nextNum = getNextInvoiceNumberForTenant(invoices, preset.id);
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyTenantPreset(preset)}
                        className={`text-left p-2.5 rounded-lg border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-sky-50/80 border-[#0284c7] ring-1 ring-[#0284c7] text-sky-950'
                            : 'bg-zinc-50/70 border-zinc-200 hover:bg-zinc-100/80 text-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs leading-tight line-clamp-1">{preset.displayName}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />}
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-1 text-[10px]">
                          <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            Next: #{nextNum}
                          </span>
                          <span className="font-medium text-[#0284c7] shrink-0 bg-sky-100/70 px-1.5 py-0.5 rounded">
                            {preset.rentMonthType === 'current' ? 'Current Month' : 'Prev Month'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-0.5">Customer / Tenant Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr Gunjesh | Dhanbad Onco Care"
                  value={customerName}
                  onChange={(e) => handleCustomerNameChange(e.target.value)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:ring-2 focus:ring-[#0284c7]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-0.5">Billing Address (Auto-populated)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bhadani Complex"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-zinc-800 focus:ring-2 focus:ring-[#0284c7]"
                />
              </div>
            </div>

            {/* FOR (Purpose) & Issuer Details */}
            <div className="border border-zinc-200 rounded-xl p-4 space-y-3 bg-white">
              <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs pb-1 border-b border-zinc-100">
                <Building2 className="w-4 h-4 text-[#0284c7]" />
                <span>FOR (Purpose) & Issuer Header</span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-0.5">FOR (Invoice Purpose / Billing Period) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rent for August 2026"
                  value={forPurpose}
                  onChange={(e) => setForPurpose(e.target.value)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:ring-2 focus:ring-[#0284c7]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-0.5">Issuer Business Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-0.5">Issuer Address & Contact</label>
                <input
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-800"
                />
              </div>
            </div>

          </div>

          {/* ITEM DESCRIPTION & AMOUNT Table */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-black text-white px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs font-bold tracking-wider">
                <span>ITEM DESCRIPTION</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold tracking-wider mr-12">AMOUNT (₹)</span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white rounded-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-2.5 bg-white">
              {items.map((item, index) => (
                <div key={item.id || index} className="flex items-center gap-3 bg-zinc-50/70 p-2 rounded-lg border border-zinc-200">
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      placeholder="e.g. August Rent, Maintenance, Electricity, DG..."
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full text-xs font-medium px-3 py-1.5 bg-white border border-zinc-300 rounded-md text-zinc-900 focus:ring-1 focus:ring-[#0284c7]"
                    />
                  </div>
                  <div className="w-44">
                    <input
                      type="number"
                      step="any"
                      placeholder="Enter amount..."
                      value={item.amount === 0 ? '' : item.amount}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        handleItemChange(index, 'amount', isNaN(val) ? 0 : val);
                      }}
                      className="w-full text-xs font-mono font-semibold px-3 py-1.5 bg-white border border-zinc-300 rounded-md text-zinc-900 text-right focus:ring-1 focus:ring-[#0284c7]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Blue Divider Line */}
            <div className="w-full h-1 bg-[#0284c7]" />

            {/* Calculations & Summary */}
            <div className="bg-zinc-50 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-xs text-zinc-500">
                {items.length} item{items.length > 1 ? 's' : ''} listed in this invoice
              </div>

              <div className="w-full sm:w-72 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-700">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-mono font-semibold">{formatCurrency(subtotal, currency)}</span>
                </div>
                
                <div className="flex justify-between items-center text-zinc-700">
                  <span>Additional costs</span>
                  <div className="w-28">
                    <input
                      type="number"
                      step="any"
                      value={additionalCosts || ''}
                      placeholder="0.00"
                      onChange={(e) => setAdditionalCosts(parseFloat(e.target.value) || 0)}
                      className="w-full text-right text-xs px-2 py-1 bg-white border border-zinc-300 rounded font-mono font-medium"
                    />
                  </div>
                </div>

                <div className="border-t border-zinc-300 pt-2 flex justify-between text-sm font-bold text-zinc-900">
                  <span>TOTAL COST</span>
                  <span className="font-mono text-base font-extrabold text-zinc-950">
                    {formatCurrency(grandTotal, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Person & Footer Message */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Contact Information (Inquiries)
              </label>
              <input
                type="text"
                value={contactPersonInfo}
                onChange={(e) => setContactPersonInfo(e.target.value)}
                placeholder="Dr D. P. Bhadani +91-9431163109, dineshbhadani05@gmail.com"
                className="w-full text-xs px-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-zinc-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Footer Message
              </label>
              <input
                type="text"
                value={footerMessage}
                onChange={(e) => setFooterMessage(e.target.value)}
                placeholder="THANK YOU FOR YOUR BUSINESS!"
                className="w-full text-xs px-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-zinc-800"
              />
            </div>
          </div>

          {/* Automatic PDF Export Checkbox */}
          <div className="flex items-center gap-2.5 p-3.5 bg-sky-50 rounded-xl border border-sky-100">
            <input
              type="checkbox"
              id="auto-pdf-toggle"
              checked={autoExportPdf}
              onChange={(e) => setAutoExportPdf(e.target.checked)}
              className="h-4 w-4 text-[#0284c7] rounded border-zinc-300 focus:ring-[#0284c7]"
            />
            <label htmlFor="auto-pdf-toggle" className="text-xs text-sky-950 font-semibold cursor-pointer">
              Automatically generate and download reference PDF invoice upon saving
            </label>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              id="save-invoice-btn"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Syncing with Google Sheet...' : editingInvoice ? 'Update in Sheet & Regenerate PDF' : 'Save to Sheet & Generate PDF'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
