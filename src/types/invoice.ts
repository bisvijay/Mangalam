export type InvoiceType = "tax_invoice" | "proforma";

export interface Seller {
  name: string;
  gstin: string;
  address: string;
  phone: string;
  stateCode: string;
  state: string;
}

export interface Buyer {
  name: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  stateCode: string;
  state: string;
}

export interface InvoiceLineItem {
  sno: number;
  description: string;
  sacCode: string;
  qty: number;
  rate: number;
  amount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface InvoiceSummary {
  subtotal: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalGST: number;
  grandTotal: number;
  roundOff: number;
  grandTotalRounded: number;
  amountInWords: string;
}

export interface GSTSummaryRow {
  rate: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface InvoicePayment {
  date: string;
  amount: number;
  method: string;
  reference: string;
}

export interface Invoice {
  id: string;
  bookingId: string;
  bookedForDate?: string;
  invoiceDate: string;
  invoiceType: InvoiceType;
  financialYear: string;
  sequenceNo: number;
  seller: Seller;
  buyer: Buyer;
  lineItems: InvoiceLineItem[];
  summary: InvoiceSummary;
  gstSummary: GSTSummaryRow[];
  payments: InvoicePayment[];
  totalPaid: number;
  balanceDue: number;
  paymentStatus: string;
  isActive?: boolean;
  notes: string;
  termsAndConditions: string;
  isSupplyIntraState: boolean;
  placeOfSupply: string;
  createdAt: string;
  createdBy: string;
}

export interface InvoiceIndexEntry {
  id: string;
  bookingId: string;
  bookedForDate?: string;
  invoiceDate: string;
  invoiceType: InvoiceType;
  customerName: string;
  grandTotal: number;
  totalPaid: number;
  balanceDue: number;
  paymentStatus: string;
  isActive?: boolean;
}
