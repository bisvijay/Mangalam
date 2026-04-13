export interface RoomConfig {
  id: string;
  floor: number;
  name: string;
  type: "Standard" | "Deluxe";
  ac: boolean;
  rate: number;
  capacity: number;
  available: boolean;
}

export interface HallConfig {
  id: string;
  floor: number | "ground";
  name: string;
  type: "Indoor" | "Outdoor";
  capacity: number;
  rate: number;
  sqft: number;
  features: string[];
  available: boolean;
}

export interface GSTSlab {
  minRate: number;
  maxRate: number;
  gstPercent: number;
  itcEligible: boolean;
  label: string;
}

export interface BusinessSettings {
  businessName: string;
  gstin: string;
  address: string;
  phone: string;
  email: string;
  stateCode: string;
  state: string;
  gstSlabs: GSTSlab[];
  defaultRoomRate: number;
  defaultTerms: string;
}
