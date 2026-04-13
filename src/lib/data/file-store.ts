import fs from "fs/promises";
import path from "path";
import { DataStore } from "./store";

const DATA_DIR = path.join(process.cwd(), "data");

async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch {
    // directory already exists
  }
}

async function readJSON<T>(filePath: string): Promise<T | null> {
  try {
    const content = (await fs.readFile(filePath, "utf-8")).replace(/^\uFEFF/, "");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

async function writeJSON<T>(filePath: string, data: T): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export class FileStore implements DataStore {
  async get<T>(collection: string, id: string): Promise<T | null> {
    const filePath = path.join(DATA_DIR, collection, `${id}.json`);
    return readJSON<T>(filePath);
  }

  async list<T>(collection: string): Promise<T[]> {
    const indexPath = path.join(DATA_DIR, collection, "_index.json");
    const data = await readJSON<T[]>(indexPath);
    return data ?? [];
  }

  async put<T>(
    collection: string,
    id: string,
    data: T,
    indexEntry: unknown
  ): Promise<void> {
    const collectionDir = path.join(DATA_DIR, collection);
    await ensureDir(collectionDir);

    // Write the full record
    const filePath = path.join(collectionDir, `${id}.json`);
    await writeJSON(filePath, data);

    // Update the index
    const indexPath = path.join(collectionDir, "_index.json");
    const index = (await readJSON<Record<string, unknown>[]>(indexPath)) ?? [];
    const existingIdx = index.findIndex(
      (entry) => (entry as { id?: string }).id === id
    );
    if (existingIdx >= 0) {
      index[existingIdx] = indexEntry as Record<string, unknown>;
    } else {
      index.push(indexEntry as Record<string, unknown>);
    }
    await writeJSON(indexPath, index);
  }

  async delete(collection: string, id: string): Promise<void> {
    const filePath = path.join(DATA_DIR, collection, `${id}.json`);
    try {
      await fs.unlink(filePath);
    } catch {
      // file doesn't exist
    }

    // Update the index
    const indexPath = path.join(DATA_DIR, collection, "_index.json");
    const index =
      (await readJSON<Record<string, unknown>[]>(indexPath)) ?? [];
    const filtered = index.filter(
      (entry) => (entry as { id?: string }).id !== id
    );
    await writeJSON(indexPath, filtered);
  }

  async getConfig<T>(configPath: string): Promise<T | null> {
    const filePath = path.join(DATA_DIR, configPath);
    return readJSON<T>(filePath);
  }

  async putConfig<T>(configPath: string, data: T): Promise<void> {
    const filePath = path.join(DATA_DIR, configPath);
    await writeJSON(filePath, data);
  }

  async exportAll<T>(collection: string): Promise<T[]> {
    const collectionDir = path.join(DATA_DIR, collection);
    try {
      const files = await fs.readdir(collectionDir);
      const records: T[] = [];
      for (const file of files) {
        if (file === "_index.json" || !file.endsWith(".json")) continue;
        const record = await readJSON<T>(path.join(collectionDir, file));
        if (record) records.push(record);
      }
      return records;
    } catch {
      return [];
    }
  }
}
