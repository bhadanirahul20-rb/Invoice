import { Invoice } from './types';

// Empty default: when there are no entries in DB, the system starts with zero entries,
// allowing Dr Saket and Dr Gunjesh to begin their sequence at 1.
export const INITIAL_SEED_INVOICES: Invoice[] = [];
