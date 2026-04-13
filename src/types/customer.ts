export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  birthday: string;
  profession: string;
  bookingIds: string[];
  inquiryIds: string[];
  eventTypes: string[];
  anniversaryDate: string;
  tags: string[];
  totalSpent: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerIndexEntry {
  id: string;
  name: string;
  phone: string;
  email: string;
  profession: string;
  tags: string[];
  totalSpent: number;
  bookingCount: number;
}
