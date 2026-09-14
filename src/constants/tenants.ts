import { Invoice } from '../types';

export interface TenantPreset {
  id: string;
  displayName: string;
  customerName: string;
  customerAddress: string;
  rentMonthType: 'previous' | 'current';
  defaultRentDescription?: (monthName: string, year: number) => string;
  defaultItems?: (monthName: string, year: number) => { description: string; amount: number }[];
}

export const TENANT_PRESETS: TenantPreset[] = [
  {
    id: 'saket',
    displayName: 'Dr Saket Narnoli (Urologia)',
    customerName: 'Dr Saket Narnoli | Urologia',
    customerAddress: 'Urologia Hospital, Bhadani Complex',
    rentMonthType: 'previous',
    defaultRentDescription: (monthName) => `${monthName} Rent`,
    defaultItems: (monthName) => [
      { description: `${monthName} Rent`, amount: 0 },
      { description: 'Maintenance', amount: 0 },
      { description: 'Electricity', amount: 0 },
      { description: 'DG', amount: 0 }
    ]
  },
  {
    id: 'gunjesh',
    displayName: 'Dr Gunjesh (Dhanbad Onco Care)',
    customerName: 'Dr Gunjesh | Dhanbad Onco Care',
    customerAddress: 'Bhadani Complex',
    rentMonthType: 'current',
    defaultRentDescription: () => 'Rent + GST',
    defaultItems: () => [
      { description: 'Rent + GST', amount: 0 },
      { description: 'Maintenance', amount: 0 },
      { description: 'Electricity', amount: 0 },
      { description: 'DG', amount: 0 },
      { description: 'DG Units Consumed: ', amount: 0 }
    ]
  }
];

/**
 * Determine canonical tenant ID from customer name or preset identifier
 */
export function getTenantId(customerNameOrId: string = ''): 'saket' | 'gunjesh' | string {
  const lower = customerNameOrId.toLowerCase().trim();
  if (lower.includes('saket') || lower.includes('urologia')) {
    return 'saket';
  }
  if (lower.includes('gunjesh') || lower.includes('onco')) {
    return 'gunjesh';
  }
  return lower;
}

/**
 * Calculate the next sequential invoice number for a specific tenant.
 * - If no entries exist for Dr Saket in DB, returns "1".
 * - If invoice 1 exists for Dr Saket, returns "2", etc.
 * - Same applies independently for Dr Gunjesh (1, then 2, etc.)
 */
export function getNextInvoiceNumberForTenant(invoices: Invoice[], customerNameOrTenantId: string = ''): string {
  const tenantId = getTenantId(customerNameOrTenantId);

  // Filter invoices belonging to this tenant
  const tenantInvoices = invoices.filter(inv => {
    const invTenantId = getTenantId(inv.customerName);
    return invTenantId === tenantId;
  });

  if (tenantInvoices.length === 0) {
    return '1';
  }

  // Parse all numeric invoice numbers for this tenant
  const nums = tenantInvoices
    .map(inv => {
      // Clean any '#' or non-digit prefix, e.g. '#1' -> 1, '1' -> 1
      const clean = String(inv.invoiceNumber || '').trim().replace(/^[^\d]+/, '');
      const parsed = parseInt(clean, 10);
      return isNaN(parsed) ? null : parsed;
    })
    .filter((n): n is number => n !== null && n > 0);

  if (nums.length === 0) {
    return '1';
  }

  const maxNum = Math.max(...nums);
  return String(maxNum + 1);
}

