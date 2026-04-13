export type EventType =
  | "Wedding"
  | "Engagement"
  | "Birthday"
  | "Anniversary"
  | "Reception"
  | "Corporate"
  | "Other";

export type BookingStatus =
  | "inquiry"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled";

export type PaymentMethod = "cash" | "upi" | "bank" | "card" | "other";

export type PaymentStatus = "unpaid" | "partial" | "paid";

export interface Payment {
  date: string;
  amount: number;
  method: PaymentMethod;
  receipt: string;
  notes?: string;
}

export interface GSTBreakdownItem {
  item: string;
  taxable: number;
  rate: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface Charges {
  roomRate: number;
  roomNights: number;
  roomTotal: number;
  hallCharge: number;
  decorationCharge: number;
  cateringCharge: number;
  otherCharges: number;
  subtotal: number;
  gstBreakdown: GSTBreakdownItem[];
  totalGST: number;
  grandTotal: number;
}

export interface EventDetails {
  brideName: string;
  brideDOB: string;
  groomName: string;
  groomDOB: string;
}

export interface CustomerRef {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface VenueSelection {
  hallId: string;
  roomsBooked: number;
  guestsCount: number;
}

export interface Booking {
  id: string;
  bookingDate: string;
  eventDate: string;
  eventEndDate: string;
  eventType: EventType;
  status: BookingStatus;
  customer: CustomerRef;
  eventDetails: EventDetails;
  venue: VenueSelection;
  charges: Charges;
  payments: Payment[];
  advance: number;
  balance: number;
  paymentStatus: PaymentStatus;
  invoiceId: string;
  cancellationNote?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface BookingIndexEntry {
  id: string;
  eventDate: string;
  eventType: EventType;
  status: BookingStatus;
  customerName: string;
  customerPhone: string;
  hallId: string;
  grandTotal: number;
  totalPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
}
