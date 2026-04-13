import { put, del, list, head } from "@vercel/blob";
import { DataStore } from "./store";

const BLOB_PREFIX = "mangalam-data/";

function blobPath(collection: string, filename: string): string {
  return `${BLOB_PREFIX}${collection}/${filename}`;
}

async function readBlobJSON<T>(blobUrl: string): Promise<T | null> {
  try {
    const response = await fetch(blobUrl, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function findBlobUrl(pathname: string): Promise<string | null> {
  try {
    const blob = await head(pathname);
    return blob.url;
  } catch {
    return null;
  }
}

export class BlobStore implements DataStore {
  async get<T>(collection: string, id: string): Promise<T | null> {
    const pathname = blobPath(collection, `${id}.json`);
    const url = await findBlobUrl(pathname);
    if (!url) return null;
    return readBlobJSON<T>(url);
  }

  async list<T>(collection: string): Promise<T[]> {
    const pathname = blobPath(collection, "_index.json");
    const url = await findBlobUrl(pathname);
    if (!url) return [];
    const data = await readBlobJSON<T[]>(url);
    return data ?? [];
  }

  async put<T>(
    collection: string,
    id: string,
    data: T,
    indexEntry: unknown
  ): Promise<void> {
    // Write the full record
    const recordPath = blobPath(collection, `${id}.json`);
    await put(recordPath, JSON.stringify(data, null, 2), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });

    // Update the index
    const indexPath = blobPath(collection, "_index.json");
    const indexUrl = await findBlobUrl(indexPath);
    const index: Record<string, unknown>[] = indexUrl
      ? ((await readBlobJSON<Record<string, unknown>[]>(indexUrl)) ?? [])
      : [];

    const existingIdx = index.findIndex(
      (entry) => (entry as { id?: string }).id === id
    );
    if (existingIdx >= 0) {
      index[existingIdx] = indexEntry as Record<string, unknown>;
    } else {
      index.push(indexEntry as Record<string, unknown>);
    }

    await put(indexPath, JSON.stringify(index, null, 2), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });
  }

  async delete(collection: string, id: string): Promise<void> {
    // Delete the record
    const recordPath = blobPath(collection, `${id}.json`);
    const recordUrl = await findBlobUrl(recordPath);
    if (recordUrl) {
      await del(recordUrl);
    }

    // Update the index
    const indexPath = blobPath(collection, "_index.json");
    const indexUrl = await findBlobUrl(indexPath);
    if (indexUrl) {
      const index =
        (await readBlobJSON<Record<string, unknown>[]>(indexUrl)) ?? [];
      const filtered = index.filter(
        (entry) => (entry as { id?: string }).id !== id
      );
      await put(indexPath, JSON.stringify(filtered, null, 2), {
        access: "public",
        addRandomSuffix: false,
        contentType: "application/json",
      });
    }
  }

  async getConfig<T>(configPath: string): Promise<T | null> {
    const pathname = `${BLOB_PREFIX}${configPath}`;
    const url = await findBlobUrl(pathname);
    if (!url) return null;
    return readBlobJSON<T>(url);
  }

  async putConfig<T>(configPath: string, data: T): Promise<void> {
    const pathname = `${BLOB_PREFIX}${configPath}`;
    await put(pathname, JSON.stringify(data, null, 2), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });
  }

  async exportAll<T>(collection: string): Promise<T[]> {
    const prefix = `${BLOB_PREFIX}${collection}/`;
    const { blobs } = await list({ prefix });
    const records: T[] = [];
    for (const blob of blobs) {
      if (blob.pathname.endsWith("_index.json")) continue;
      if (!blob.pathname.endsWith(".json")) continue;
      const record = await readBlobJSON<T>(blob.url);
      if (record) records.push(record);
    }
    return records;
  }
}
