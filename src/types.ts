export interface InvoiceItem {
  id: string;
  description: string;
  quantity?: number;
  unitPrice?: number;
  taxPercent?: number;
  amount: number;
}

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "13"
  sheetRowIndex?: number; // 1-indexed row number in Google Sheet
  date: string; // e.g. "01 May, 2026" or "2026-05-01"
  dueDate?: string;
  status: InvoiceStatus;
  
  // Issuer details (company info)
  companyName: string; // "Bhadani Complex"
  companyAddress: string; // "Satyam Nagar, Dhanbad, 826001"
  companyPhone: string; // "9431163109"
  companyEmail: string; // "dineshbhadani05@gmail.com"
  companyTaxId?: string;
  
  // Customer / Tenant details (BILL TO)
  customerName: string; // e.g. "Dr Saket Narnoli | Urologia"
  customerAddress: string; // e.g. "Urologia Hospital, Bhadani Complex"
  customerEmail?: string;
  customerPhone?: string;

  // Purpose (FOR)
  forPurpose: string; // e.g. "Rent for April 2025"
  
  // Items & Calculations
  items: InvoiceItem[];
  subtotal: number;
  taxRate?: string;
  taxTotal: number;
  additionalCosts?: number;
  discountTotal: number;
  total: number;
  currency: string; // default "INR"
  
  // Contact & notes
  contactPersonInfo?: string; // "Dr D. P. Bhadani +91-9431163109, dineshbhadani05@gmail.com"
  footerMessage?: string; // "THANK YOU FOR YOUR BUSINESS!"
  notes?: string;
  paymentTerms?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  spreadsheetName: string;
  sheetName: string;
  sheetUrl: string;
}

export interface GoogleUser {
  email: string;
  name: string;
  picture?: string;
}
