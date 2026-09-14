import { Invoice, GoogleSheetsConfig } from '../types';

// The columns we store in the Google Sheet
export const SHEET_COLUMNS = [
  'Invoice Number',
  'Date',
  'Due Date',
  'Status',
  'Customer Name',
  'Customer Address',
  'For / Purpose',
  'Items Summary',
  'Subtotal',
  'Tax Rate',
  'Tax Total',
  'Additional Costs',
  'Total',
  'Currency',
  'Contact Person',
  'Footer Message',
  'Notes',
  'Items JSON',
  'Company JSON',
  'Updated At'
];

export const SPREADSHEET_TITLE = 'Bhadani Complex Invoices Registry';
export const DEFAULT_SHEET_NAME = 'Invoices';

/**
 * Transforms an Invoice object into a row array for Google Sheets
 */
export function invoiceToSheetRow(invoice: Invoice): (string | number)[] {
  const itemsSummary = invoice.items
    .map(i => `${i.description}: ₹ ${Number(i.amount).toLocaleString('en-IN')}`)
    .join('; ');

  const companyJSON = JSON.stringify({
    name: invoice.companyName,
    email: invoice.companyEmail,
    address: invoice.companyAddress,
    phone: invoice.companyPhone,
    taxId: invoice.companyTaxId
  });

  return [
    invoice.invoiceNumber,
    invoice.date,
    invoice.dueDate || '',
    invoice.status,
    invoice.customerName,
    invoice.customerAddress,
    invoice.forPurpose || '',
    itemsSummary,
    invoice.subtotal,
    invoice.taxRate || '',
    invoice.taxTotal || 0,
    invoice.additionalCosts || 0,
    invoice.total,
    invoice.currency || 'INR',
    invoice.contactPersonInfo || '',
    invoice.footerMessage || '',
    invoice.notes || '',
    JSON.stringify(invoice.items),
    companyJSON,
    invoice.updatedAt || new Date().toISOString()
  ];
}

/**
 * Transforms a Google Sheet row array back into an Invoice object
 */
export function sheetRowToInvoice(row: any[], rowIndex: number): Invoice | null {
  if (!row || row.length === 0 || !row[0]) return null;

  const invoiceNumber = String(row[0] || '').trim();
  if (!invoiceNumber) return null;

  const date = String(row[1] || '');
  const dueDate = String(row[2] || '');
  const status = (String(row[3] || 'pending').toLowerCase()) as Invoice['status'];
  const customerName = String(row[4] || '');
  const customerAddress = String(row[5] || '');
  const forPurpose = String(row[6] || '');
  const subtotal = Number(row[8]) || 0;
  const taxRate = String(row[9] || '');
  const taxTotal = Number(row[10]) || 0;
  const additionalCosts = Number(row[11]) || 0;
  const total = Number(row[12]) || 0;
  const currency = String(row[13] || 'INR');
  const contactPersonInfo = String(row[14] || '');
  const footerMessage = String(row[15] || '');
  const notes = String(row[16] || '');

  let items = [];
  try {
    if (row[17]) {
      items = JSON.parse(row[17]);
    }
  } catch (e) {
    items = [];
  }

  // If no items parsed from JSON, fallback to row item summary
  if (!items || items.length === 0) {
    items = [{
      id: 'item-1',
      description: row[7] || 'Invoice Item',
      amount: subtotal || total
    }];
  }

  let company = {
    name: 'Bhadani Complex',
    email: 'dineshbhadani05@gmail.com',
    address: 'Satyam Nagar, Dhanbad, 826001',
    phone: '9431163109',
    taxId: ''
  };

  try {
    if (row[18]) {
      const parsedCompany = JSON.parse(row[18]);
      company = { ...company, ...parsedCompany };
    }
  } catch (e) {
    // Keep fallback company info
  }

  return {
    id: invoiceNumber,
    invoiceNumber,
    sheetRowIndex: rowIndex,
    date,
    dueDate,
    status,
    companyName: company.name,
    companyEmail: company.email,
    companyAddress: company.address,
    companyPhone: company.phone,
    companyTaxId: company.taxId,
    customerName,
    customerAddress,
    forPurpose,
    items,
    subtotal,
    taxRate,
    taxTotal,
    additionalCosts,
    discountTotal: 0,
    total: total || subtotal,
    currency,
    contactPersonInfo: contactPersonInfo || 'Dr D. P. Bhadani +91-9431163109, dineshbhadani05@gmail.com',
    footerMessage: footerMessage || 'THANK YOU FOR YOUR BUSINESS!',
    notes,
    createdAt: date,
    updatedAt: String(row[19] || date)
  };
}

/**
 * Helper to fetch with Bearer token
 */
async function callGoogleApi(url: string, token: string, options: RequestInit = {}) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_user');
      throw new Error('Google authorization expired or invalid (401). Please click "Connect Google Sheets" to authorize access.');
    }
    const errorBody = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(errorBody);
    } catch {
      parsed = { message: errorBody };
    }
    throw new Error(parsed.error?.message || parsed.message || `Google API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Searches for an existing "Business Invoices Registry" spreadsheet in Google Drive or creates a new one
 */
export async function getOrCreateInvoiceSheet(token: string): Promise<GoogleSheetsConfig> {
  // Check localStorage first for previously saved spreadsheet ID
  const savedConfig = localStorage.getItem('invoice_sheets_config');
  if (savedConfig) {
    try {
      const parsed: GoogleSheetsConfig = JSON.parse(savedConfig);
      // Validate sheet exists and is accessible
      try {
        const metadata = await callGoogleApi(
          `https://sheets.googleapis.com/v4/spreadsheets/${parsed.spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties`,
          token
        );
        if (metadata && metadata.spreadsheetId) {
          return parsed;
        }
      } catch (err) {
        console.warn('Saved sheet not reachable, finding or creating fresh:', err);
      }
    } catch (e) {
      // ignore
    }
  }

  // 1. Search Google Drive for an existing spreadsheet named SPREADSHEET_TITLE
  try {
    const query = encodeURIComponent(`name = '${SPREADSHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
    const driveSearch = await callGoogleApi(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)&pageSize=1`,
      token
    );

    if (driveSearch.files && driveSearch.files.length > 0) {
      const file = driveSearch.files[0];
      const config: GoogleSheetsConfig = {
        spreadsheetId: file.id,
        spreadsheetName: file.name,
        sheetName: DEFAULT_SHEET_NAME,
        sheetUrl: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}`
      };
      localStorage.setItem('invoice_sheets_config', JSON.stringify(config));
      return config;
    }
  } catch (err) {
    console.warn('Drive search failed, proceeding to create new sheet:', err);
  }

  // 2. Create a brand new Google Spreadsheet
  const createPayload = {
    properties: {
      title: SPREADSHEET_TITLE
    },
    sheets: [
      {
        properties: {
          title: DEFAULT_SHEET_NAME,
          gridProperties: {
            frozenRowCount: 1
          }
        }
      }
    ]
  };

  const newSheet = await callGoogleApi(
    'https://sheets.googleapis.com/v4/spreadsheets',
    token,
    {
      method: 'POST',
      body: JSON.stringify(createPayload)
    }
  );

  const spreadsheetId = newSheet.spreadsheetId;
  const sheetUrl = newSheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // Write header row with formatting
  await callGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${DEFAULT_SHEET_NAME}!A1:${String.fromCharCode(65 + SHEET_COLUMNS.length - 1)}1?valueInputOption=USER_ENTERED`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify({
        range: `${DEFAULT_SHEET_NAME}!A1:${String.fromCharCode(65 + SHEET_COLUMNS.length - 1)}1`,
        majorDimension: 'ROWS',
        values: [SHEET_COLUMNS]
      })
    }
  );

  const config: GoogleSheetsConfig = {
    spreadsheetId,
    spreadsheetName: SPREADSHEET_TITLE,
    sheetName: DEFAULT_SHEET_NAME,
    sheetUrl
  };

  localStorage.setItem('invoice_sheets_config', JSON.stringify(config));
  return config;
}

/**
 * Read all invoices from the Google Sheet
 */
export async function readInvoicesFromSheet(spreadsheetId: string, sheetName: string, token: string): Promise<Invoice[]> {
  const endCol = String.fromCharCode(65 + SHEET_COLUMNS.length - 1);
  const range = `${sheetName}!A2:${endCol}1000`;
  const data = await callGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    token
  );

  const rows = data.values || [];
  const invoices: Invoice[] = [];

  rows.forEach((row: any[], index: number) => {
    // rowIndex in sheet is index + 2 (1-based, plus 1 for header)
    const inv = sheetRowToInvoice(row, index + 2);
    if (inv) {
      invoices.push(inv);
    }
  });

  return invoices;
}

/**
 * Add a new invoice row to Google Sheet (CREATE)
 */
export async function appendInvoiceToSheet(spreadsheetId: string, sheetName: string, invoice: Invoice, token: string): Promise<number> {
  const row = invoiceToSheetRow(invoice);
  const endCol = String.fromCharCode(65 + SHEET_COLUMNS.length - 1);
  const range = `${sheetName}!A:${endCol}`;
  
  const result = await callGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        values: [row]
      })
    }
  );

  // Extract updated row index if available
  const updatedRange = result.updates?.updatedRange || '';
  const match = updatedRange.match(/!A(\d+):/);
  const newRowIndex = match ? parseInt(match[1], 10) : undefined;
  return newRowIndex || 2;
}

/**
 * Update an existing invoice in the Google Sheet (UPDATE)
 */
export async function updateInvoiceInSheet(spreadsheetId: string, sheetName: string, invoice: Invoice, token: string): Promise<void> {
  const meta = await callGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    token
  );
  
  const targetSheet = meta.sheets?.find((s: any) => 
    s.properties?.title?.trim().toLowerCase() === sheetName.trim().toLowerCase()
  ) || meta.sheets?.[0];

  const actualSheetTitle = targetSheet?.properties?.title || sheetName;

  // Search live sheet for row index
  const rangeCol = `${actualSheetTitle}!A1:A1000`;
  const sheetData = await callGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeCol)}`,
    token
  );

  const rows: any[][] = sheetData.values || [];
  const targetRaw = String(invoice.invoiceNumber || '').trim();
  const targetClean = targetRaw.toLowerCase().replace(/^#\s*/, '');
  const targetInt = parseInt(targetClean, 10);

  let targetRow: number | null = null;
  for (let i = 1; i < rows.length; i++) {
    const cell0 = String(rows[i]?.[0] || '').trim();
    const cell0Clean = cell0.toLowerCase().replace(/^#\s*/, '');
    const cell0Int = parseInt(cell0Clean, 10);
    if (cell0 === targetRaw || (cell0Clean && targetClean && cell0Clean === targetClean) || (!isNaN(targetInt) && !isNaN(cell0Int) && targetInt === cell0Int)) {
      targetRow = i + 1; // 1-indexed row in sheet
      break;
    }
  }

  if (!targetRow && invoice.sheetRowIndex && invoice.sheetRowIndex <= rows.length) {
    targetRow = invoice.sheetRowIndex;
  }

  if (!targetRow) {
    // If invoice not found in sheet, append it
    await appendInvoiceToSheet(spreadsheetId, actualSheetTitle, invoice, token);
    return;
  }

  const row = invoiceToSheetRow(invoice);
  const endCol = String.fromCharCode(65 + SHEET_COLUMNS.length - 1);
  const range = `${actualSheetTitle}!A${targetRow}:${endCol}${targetRow}`;

  await callGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: [row]
      })
    }
  );
}

/**
 * Delete an invoice from the Google Sheet (DELETE)
 * Scans the live Google Sheet column A to locate all matching rows,
 * then deletes them using batchUpdate deleteDimension.
 */
export async function deleteInvoiceFromSheet(
  spreadsheetId: string, 
  sheetName: string, 
  invoice: Invoice, 
  token: string
): Promise<{ deletedRows: number }> {
  // 1. Fetch the spreadsheet metadata to get the integer sheetId and exact title
  const meta = await callGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    token
  );
  
  const targetSheet = meta.sheets?.find((s: any) => 
    s.properties?.title?.trim().toLowerCase() === sheetName.trim().toLowerCase()
  ) || meta.sheets?.[0];

  if (!targetSheet?.properties) {
    throw new Error(`Sheet tab "${sheetName}" not found in spreadsheet.`);
  }

  const sheetId = targetSheet.properties.sheetId ?? 0;
  const actualSheetTitle = targetSheet.properties.title || sheetName;

  // 2. Fetch live rows from the sheet (columns A through G) to identify all rows for this invoice
  const range = `${actualSheetTitle}!A1:G1000`;
  const sheetData = await callGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    token
  );

  const rows: any[][] = sheetData.values || [];
  if (rows.length <= 1) {
    // Only header row or completely empty
    return { deletedRows: 0 };
  }

  const targetRaw = String(invoice.invoiceNumber || '').trim();
  const targetClean = targetRaw.toLowerCase().replace(/^#\s*/, '');
  const targetInt = parseInt(targetClean, 10);
  const targetCustomer = String(invoice.customerName || '').trim().toLowerCase();

  // Find all row indices (0-indexed) that match the invoice number
  // Row 0 is the header ("Invoice Number"), so scan rows 1 through rows.length - 1
  const matchingRowIndices: number[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const cell0 = String(row[0] || '').trim();
    const cell0Clean = cell0.toLowerCase().replace(/^#\s*/, '');
    const cell0Int = parseInt(cell0Clean, 10);

    let isMatch = false;
    if (cell0 === targetRaw) {
      isMatch = true;
    } else if (cell0Clean && targetClean && cell0Clean === targetClean) {
      isMatch = true;
    } else if (!isNaN(targetInt) && !isNaN(cell0Int) && targetInt === cell0Int) {
      isMatch = true;
    }

    if (isMatch) {
      matchingRowIndices.push(i);
    }
  }

  // Fallback: If no exact invoice number match, but sheetRowIndex exists and customer matches
  if (matchingRowIndices.length === 0 && invoice.sheetRowIndex && invoice.sheetRowIndex > 1 && invoice.sheetRowIndex <= rows.length) {
    const candidateIdx = invoice.sheetRowIndex - 1;
    const candidateRow = rows[candidateIdx];
    const candidateCustomer = String(candidateRow?.[4] || '').trim().toLowerCase();
    if (candidateCustomer && targetCustomer && (candidateCustomer.includes(targetCustomer) || targetCustomer.includes(candidateCustomer))) {
      matchingRowIndices.push(candidateIdx);
    }
  }

  if (matchingRowIndices.length === 0) {
    console.warn(`Invoice ${invoice.invoiceNumber} not found in Google Sheet. It may have already been deleted.`);
    return { deletedRows: 0 };
  }

  // Sort descending so deleting higher rows doesn't invalidate lower row indices!
  matchingRowIndices.sort((a, b) => b - a);

  const requests = matchingRowIndices.map(rowIndex => ({
    deleteDimension: {
      range: {
        sheetId,
        dimension: 'ROWS',
        startIndex: rowIndex,
        endIndex: rowIndex + 1
      }
    }
  }));

  await callGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ requests })
    }
  );

  return { deletedRows: matchingRowIndices.length };
}
