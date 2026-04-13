import { DataStore } from "./store";
import { FileStore } from "./file-store";
import { BlobStore } from "./blob-store";

export type { DataStore } from "./store";

let _store: DataStore | null = null;

export function getStore(): DataStore {
  if (!_store) {
    const backend = process.env.DATA_STORE ?? "file";
    _store = backend === "blob" ? new BlobStore() : new FileStore();
  }
  return _store;
}
