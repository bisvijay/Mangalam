export type InventoryCategory =
  | "Utensils"
  | "Linen"
  | "Decoration"
  | "Kitchen"
  | "Cleaning"
  | "Furniture"
  | "Electronics"
  | "Other";

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  minStock: number;
  location: string;
  lastUpdated: string;
  notes: string;
}

export interface InventoryIndexEntry {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  minStock: number;
  isLowStock: boolean;
}
