export type MediaType = "photo" | "video";

export type MediaCategory =
  | "Main Hall"
  | "Outdoor Hall"
  | "1st Floor Hall"
  | "2nd Floor Hall"
  | "3rd Floor Hall"
  | "Rooms"
  | "Kitchen"
  | "Parking"
  | "Events"
  | "Other";

export interface GalleryItem {
  id: string;
  type: MediaType;
  url: string;
  thumbnail: string;
  title: string;
  category: MediaCategory;
  tags: string[];
  order: number;
  visible: boolean;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Gallery {
  items: GalleryItem[];
}
