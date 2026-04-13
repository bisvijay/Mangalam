export interface PublicEvent {
  id: string;
  name: string;
  date: string;
  details: string;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicEventIndexEntry {
  id: string;
  name: string;
  date: string;
  visible: boolean;
}
