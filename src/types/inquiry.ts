export type InquiryStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "converted"
  | "lost";

export interface FollowUp {
  date: string;
  by: string;
  method: "phone" | "email" | "whatsapp" | "in-person";
  notes: string;
}

export interface Inquiry {
  id: string;
  source: "website" | "phone" | "walk-in" | "referral";
  submittedAt: string;
  name: string;
  phone: string;
  email: string;
  eventType: string;
  preferredDate: string;
  guestsEstimate: number;
  hallPreference: string;
  roomsNeeded: boolean;
  message: string;
  status: InquiryStatus;
  followUps: FollowUp[];
  quotedAmount: number;
  convertedToBookingId: string;
  lostReason: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
}

export interface InquiryIndexEntry {
  id: string;
  name: string;
  phone: string;
  eventType: string;
  preferredDate: string;
  status: InquiryStatus;
  submittedAt: string;
  quotedAmount: number;
}
