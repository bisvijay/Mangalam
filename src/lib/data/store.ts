export interface DataStore {
  /** Get a single record by collection and ID */
  get<T>(collection: string, id: string): Promise<T | null>;

  /** List all index entries for a collection */
  list<T>(collection: string): Promise<T[]>;

  /** Write a record and update the index */
  put<T>(collection: string, id: string, data: T, indexEntry: unknown): Promise<void>;

  /** Delete a record and update the index */
  delete(collection: string, id: string): Promise<void>;

  /** Get a config/singleton file (e.g., rooms/config.json) */
  getConfig<T>(path: string): Promise<T | null>;

  /** Write a config/singleton file */
  putConfig<T>(path: string, data: T): Promise<void>;

  /** Export all records in a collection */
  exportAll<T>(collection: string): Promise<T[]>;
}
